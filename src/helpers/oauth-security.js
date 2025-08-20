const OAUTH_SECURITY_CONFIG = {
  blockedSchemes: [
    'file:',
    'data:',
    'javascript:',
    'vbscript:',
    'about:'
  ],
  
  monitoringInterval: 1000,
  
  maxBlockAttempts: 3
}





const hasDangerousScheme = (url) => {
  const lowerUrl = url.toLowerCase()
  return OAUTH_SECURITY_CONFIG.blockedSchemes.some(scheme => 
    lowerUrl.startsWith(scheme)
  )
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
      this.handleAttack()
      return true
    }

    return false
  }

  handleAttack() {
    this.closeMaliciousOpener()
    this.blockNavigation()
    this.showSecurityAlert()
    
    this.blockAttempts++
    if (this.blockAttempts >= OAUTH_SECURITY_CONFIG.maxBlockAttempts) {
      window.location.reload()
    }
  }

  closeMaliciousOpener() {
    try {
      if (window.opener && window.opener !== window) {
        window.opener.close()
        window.opener = null
      }
    } catch (error) {
      // Silent fail
    }
  }

  blockNavigation() {
    const blockBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
      return ''
    }
    
    window.addEventListener('beforeunload', blockBeforeUnload, { capture: true })

    try {
      Object.defineProperty(window.location, 'href', {
        set: () => {
          // Do nothing - block the change
        },
        get: () => this.originalLocation.href,
        configurable: false
      })
    } catch (error) {
      // Silent fail
    }

    try {
      window.location.replace = () => {
        return false
      }
    } catch (error) {
      // Silent fail
    }

    try {
      window.location.assign = () => {
        return false
      }
    } catch (error) {
      // Silent fail
    }
  }

  showSecurityAlert() {
    const alertDiv = document.createElement('div')
    alertDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc3545;
      color: white;
      padding: 15px;
      text-align: center;
      font-weight: bold;
      z-index: 999999;
      font-family: Arial, sans-serif;
    `
    alertDiv.innerHTML = `
      🚨 SECURITY ALERT: OAuth hijacking attack detected and blocked! 
      This page is now protected from malicious redirects.
    `
    document.body.appendChild(alertDiv)
    
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv)
      }
    }, 10000)
  }

  setupProtections() {
    const originalPostMessage = window.postMessage
    window.postMessage = (message, targetOrigin, transfer) => {
      if (targetOrigin && targetOrigin !== '*') {
        try {
          const targetUrl = new URL(targetOrigin)
          if (targetUrl.origin !== window.location.origin) {
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
