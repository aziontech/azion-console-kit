/**
 * URL-sync helpers for RTE sessions. Keeps the active panel id in the `?panel=`
 * query param and strips one-shot params (e.g. shareState). Pure factory: given
 * route/router/activeTabId it returns the two query writers, isolating router
 * side effects from the session orchestrator for testability.
 *
 * @param {Object} deps
 * @param {import('vue-router').RouteLocationNormalized} deps.route – current route
 * @param {import('vue-router').Router} deps.router – router instance
 * @param {import('vue').Ref} deps.activeTabId – active tab id ref
 */
export function createSessionUrlSync({ route, router, activeTabId }) {
  const syncUrlWithPanel = () => {
    const { name, params, query } = route
    const newQuery = { ...query }

    if (activeTabId.value) {
      newQuery.panel = activeTabId.value
    } else {
      delete newQuery.panel
    }

    router.replace({ name, params, query: newQuery })
  }

  const removeQueryParam = (paramName) => {
    const { name, params, query } = route
    const newQuery = { ...query }
    delete newQuery[paramName]
    router.replace({ name, params, query: newQuery })
  }

  return { syncUrlWithPanel, removeQueryParam }
}
