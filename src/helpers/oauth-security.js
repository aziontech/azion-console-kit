/**
 * OAuth Security Helper
 * Implements security measures to prevent OAuth hijacking attacks
 * Only applies to authentication pages to avoid breaking external links
 */

/**
 * Check if current page is an authentication page
 * Based on azion.config.mjs COOP headers configuration
 */
const isAuthPage = () => {
  const authPaths = ['/login', '/signup', '/switch-account', '/mfa', '/github-connection-popup']
  return authPaths.some(path => window.location.pathname.startsWith(path))
}

/**
 * Prevents control by malicious parent window
 * Only applies to authentication pages to avoid breaking external links
 */
export const preventParentWindowControl = () => {
  // Only apply protection on authentication pages
  if (!isAuthPage()) {
    return
  }

  if (window.opener) {
    try {
      if (window.opener.origin) {
        // Safe: Opened by the same origin
        return
      }
    } catch {
      // Cross-origin opener detected - close it to prevent attacks
      try {
        window.opener.close()
      } catch (closeError) {
        // If we can't close it, try to neutralize it
        try {
          window.opener = null
        } catch (neutralizeError) {
          // Last resort: reload to prevent any potential control
          window.location.reload()
        }
      }
    }
  }
}

/**
 * Inicializa as medidas de segurança do OAuth
 * Deve ser chamada quando a aplicação inicia
 * Funciona em conjunto com os headers COOP do azion.config.mjs
 */
export const initOAuthSecurity = () => {
  // Previne o controle da janela pai apenas em páginas de autenticação
  preventParentWindowControl()
  
  // Segurança adicional: define a política de referrer se ainda não estiver definida
  if (!document.querySelector('meta[name="referrer"]')) {
    const metaReferrer = document.createElement('meta')
    metaReferrer.name = 'referrer'
    metaReferrer.content = 'strict-origin-when-cross-origin'
    document.head.appendChild(metaReferrer)
  }
}
