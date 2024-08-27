import { getRedirectRoute } from '@/helpers'

/** @type {import('vue-router').NavigationGuardWithThis} */
export function redirectGuard(to, next, router) {
  if (to.name === 'home') {
    const redirectRoute = getRedirectRoute(router)
    if (redirectRoute) {
      return next(redirectRoute)
    }
  }
}
