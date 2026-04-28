/**
 * Gets the HubSpot user token (utk) from the cookie.
 * HubSpot sets a cookie named 'hubspotutk' for visitor identification.
 * @returns {string|undefined} The hubspotutk value or undefined if not found
 */
export function getHubSpotUtk() {
  // Try different cookie name patterns that HubSpot might use
  const patterns = [/hubspotutk=([^;]+)/, /hubspotutk[^=]*=([^;]+)/]

  for (const pattern of patterns) {
    const match = document.cookie.match(pattern)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  }

  // Fallback: parse all cookies manually
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const trimmed = cookie.trim()
    if (trimmed.startsWith('hubspotutk')) {
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex !== -1) {
        const value = trimmed.substring(eqIndex + 1)
        return value ? decodeURIComponent(value) : undefined
      }
    }
  }

  return undefined
}

/**
 * Gets URL query parameters as an object.
 * @returns {Object} Key-value pairs of query parameters
 */
function getQueryParams() {
  const params = {}
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * Gets HubSpot context properties from the browser environment.
 * These map to HubSpot's native behavioral event properties.
 * @returns {Object} Object containing hs_* properties
 */
export function getHubSpotContext() {
  const queryParams = getQueryParams()

  return {
    // Page context
    hs_page_url: window.location.href,
    hs_page_title: document.title,
    hs_referrer: document.referrer || undefined,

    // Device/Screen context
    hs_screen_height: window.screen?.height,
    hs_screen_width: window.screen?.width,
    hs_user_agent: navigator.userAgent,
    hs_language: navigator.language,

    // UTM parameters (if present in URL)
    ...(queryParams.utm_campaign && { hs_utm_campaign: queryParams.utm_campaign }),
    ...(queryParams.utm_source && { hs_utm_source: queryParams.utm_source }),
    ...(queryParams.utm_medium && { hs_utm_medium: queryParams.utm_medium }),
    ...(queryParams.utm_content && { hs_utm_content: queryParams.utm_content }),
    ...(queryParams.utm_term && { hs_utm_term: queryParams.utm_term })
  }
}
