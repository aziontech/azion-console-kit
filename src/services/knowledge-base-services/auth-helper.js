/**
 * Authentication helper for Knowledge Base services
 * Provides options for both cookie-based and token-based authentication
 */

/**
 * Get authentication headers based on environment configuration
 * @returns {Object} Headers object with authentication
 */
export const getAuthHeaders = () => {
  const useTokenAuth = import.meta.env.VITE_USE_API_TOKEN === 'true'
  const apiToken = import.meta.env.VITE_API_TOKEN

  const headers = {
    'Accept': 'application/json'
  }

  // If token auth is enabled and token exists, add Authorization header
  if (useTokenAuth && apiToken) {
    headers['Authorization'] = `Token ${apiToken}`
    console.log('🔑 Using Token Authentication')
  } else {
    console.log('🍪 Using Cookie Authentication (withCredentials)')
  }

  return headers
}

/**
 * Check if token authentication is enabled
 * @returns {boolean}
 */
export const isTokenAuthEnabled = () => {
  return import.meta.env.VITE_USE_API_TOKEN === 'true' && !!import.meta.env.VITE_API_TOKEN
}
