/**
 * Checks if the `to` route is valid based on the path, parameters, and query.
 *
 * @param {Object} to - The `to` object from Vue Router.
 * @returns {boolean} - Returns `true` if the route is valid, otherwise `false`.
 */
const isValidRoute = (redirect, router) => {
  const matchedRoute = router.getRoutes().some((route) => {
    return route.name === redirect.name
  })
  return matchedRoute
}

/**
 * Stores the `to` object in localStorage, including path, parameters, and query strings,
 * with simple encryption and an expiration time.
 *
 * @param {Object} to - The `to` object from Vue Router.
 * @param {number} [expirationMinutes=60] - The expiration time in minutes.
 */
export const setRedirectRoute = (
  { name, path, params, query, fullPath },
  expirationMinutes = 60
) => {
  if (path === '/') return
  const now = new Date()
  const MILLISECONDS_PER_MINUTE = 60000
  const expiration = new Date(now.getTime() + expirationMinutes * MILLISECONDS_PER_MINUTE)
  const redirectData = {
    name,
    path,
    params,
    query,
    fullPath,
    expiresAt: expiration.getTime()
  }

  const encryptedData = btoa(JSON.stringify(redirectData))
  localStorage.setItem('redirectRoute', encryptedData)
}

/**
 * Retrieves the `to` object stored in localStorage, if it is still valid and has not expired.
 *
 * @returns {Object|null} - Returns a `to` object or `null` if it is not valid.
 */
export const getRedirectRoute = (router) => {
  const encryptedData = localStorage.getItem('redirectRoute')

  if (!encryptedData) return null

  const decryptedData = JSON.parse(atob(encryptedData))
  const now = new Date().getTime()

  localStorage.removeItem('redirectRoute')
  const isValid = isValidRoute(decryptedData, router)
  if (now > decryptedData.expiresAt || !isValid) return null

  return decryptedData
}
