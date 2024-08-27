import router from '@/router'

/**
 * Checks if the `to` route is valid based on the path, parameters, and query.
 *
 * @param {Object} to - The `to` object from Vue Router.
 * @returns {boolean} - Returns `true` if the route is valid, otherwise `false`.
 */
const isValidRoute = (redirect) => {
  const matchedRoute = router.getRoutes().find((route) => {
    return route.name === redirect.name
  })

  return Boolean(matchedRoute)
}

/**
 * Stores the `to` object in localStorage, including path, parameters, and query strings,
 * with simple encryption and an expiration time.
 *
 * @param {Object} to - The `to` object from Vue Router.
 * @param {number} [expirationMinutes=60] - The expiration time in minutes.
 */
const setRedirectRoute = ({ name, path, params, query, fullPath }, expirationMinutes = 60) => {
  const now = new Date()
  const expiration = new Date(now.getTime() + expirationMinutes * 60000)
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
const getRedirectRoute = () => {
  const encryptedData = localStorage.getItem('redirectRoute')
  const decryptedData = JSON.parse(atob(encryptedData))

  if (!encryptedData || !decryptedData) return null

  const now = new Date().getTime()

  localStorage.removeItem('redirectRoute')

  if (now > decryptedData.expiresAt || !isValidRoute(decryptedData)) return null

  return decryptedData
}

export { setRedirectRoute, getRedirectRoute, isValidRoute }
