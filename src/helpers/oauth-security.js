const OAUTH_SECURITY_CONFIG = {
  blockedSchemes: ['file:', 'data:', 'javascript:', 'vbscript:', 'about:'],

  trustedOrigins: ['https://github.com', 'https://api.github.com'],

  monitoringInterval: 1000,

  maxBlockAttempts: 3
}

const hasDangerousScheme = (url) => {
  const lowerUrl = url.toLowerCase()
  return OAUTH_SECURITY_CONFIG.blockedSchemes.some((scheme) => lowerUrl.startsWith(scheme))
}

export const validateOAuthRedirect = (url) => {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    new URL(url)
    return !hasDangerousScheme(url)
  } catch {
    return false
  }
}

const logError = (context, error) => {
  // eslint-disable-next-line no-console
  console.warn(`Ignored error in ${context}:`, error)
}

const ignoreError = (fn, context = '') => {
  try {
    fn()
  } catch (error) {
    logError(context, error)
  }
}

class OAuthSecurityGuard {
  constructor() {
    this.isActive = false
    this.blockAttempts = 0
    this.monitoringInterval = null
    this.originalLocation = {
      href: window.location.href,
      replace: window.location.replace,
      assign: window.location.assign
    }
  }

  init() {
    if (this.isActive) {
      return
    }

    this.isActive = true
    this.detectAndBlockAttack()
    this.setupProtections()
    this.startMonitoring()
  }

  detectAndBlockAttack() {
    if (!window.opener) {
      return false
    }

    try {
      const openerOrigin = window.opener.location.origin
      const currentOrigin = window.location.origin

      if (openerOrigin !== currentOrigin) {
        this.handleAttack()
        return true
      }
    } catch (error) {
      // Cross-origin opener (like OAuth flows) will throw here
      // This is expected behavior - not necessarily an attack
      // Only handle as attack if we can detect malicious patterns
      return false
    }

    return false
  }

  handleAttack() {
    this.closeMaliciousOpener()
    this.blockNavigation()

    this.blockAttempts++
    if (this.blockAttempts >= OAUTH_SECURITY_CONFIG.maxBlockAttempts) {
      window.location.reload()
    }
  }

  closeMaliciousOpener() {
    if (window.opener && window.opener !== window) {
      window.opener?.close?.()
      window.opener = null
    }
  }

  blockNavigation() {
    const blockBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', blockBeforeUnload, { capture: true })

    this.overrideLocationHref()
    this.overrideLocationMethods()
  }

  overrideLocationHref() {
    ignoreError(() => {
      Object.defineProperty(window.location, 'href', {
        set: () => {},
        get: () => this.originalLocation.href,
        configurable: false
      })
    }, 'overrideLocationHref')
  }

  overrideLocationMethods() {
    ignoreError(() => {
      window.location.replace = () => false
    }, 'overrideLocationMethods.replace')

    ignoreError(() => {
      window.location.assign = () => false
    }, 'overrideLocationMethods.assign')
  }

  setupProtections() {
    const originalPostMessage = window.postMessage
    window.postMessage = (message, targetOrigin, transfer) => {
      if (targetOrigin && targetOrigin !== '*') {
        try {
          const targetUrl = new URL(targetOrigin)
          const isTrustedOrigin = OAUTH_SECURITY_CONFIG.trustedOrigins.some(
            (trusted) => targetUrl.origin === trusted || targetUrl.origin.endsWith(trusted)
          )
          const isSameOrigin = targetUrl.origin === window.location.origin

          if (!isSameOrigin && !isTrustedOrigin) {
            // eslint-disable-next-line no-console
            console.warn('Blocked postMessage to untrusted origin:', targetUrl.origin)
            return
          }
        } catch {
          return
        }
      }
      return originalPostMessage.call(window, message, targetOrigin, transfer)
    }

    let originalOpen = window.open
    window.open = (url, name, features) => {
      if (url && !validateOAuthRedirect(url)) {
        return null
      }
      return originalOpen.call(window, url, name, features)
    }
  }

  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.detectAndBlockAttack()
    }, OAUTH_SECURITY_CONFIG.monitoringInterval)
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isActive = false
  }
}

const oauthSecurityGuard = new OAuthSecurityGuard()

export const initOAuthSecurity = () => {
  if (!document.querySelector('meta[name="referrer"]')) {
    const metaReferrer = document.createElement('meta')
    metaReferrer.name = 'referrer'
    metaReferrer.content = 'strict-origin-when-cross-origin'
    document.head.appendChild(metaReferrer)
  }

  oauthSecurityGuard.init()
}

export const cleanupOAuthSecurity = () => {
  oauthSecurityGuard.stop()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOAuthSecurity)
} else {
  initOAuthSecurity()
}
