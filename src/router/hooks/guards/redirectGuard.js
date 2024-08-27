import { getRedirectRoute } from '@/helpers'

/** @type {import('vue-router').NavigationGuardWithThis} */
export function redirectGuard(to, next) {
  if (to.name === 'home') {
    const redirectRoute = getRedirectRoute()
    if (redirectRoute) {
      return next(redirectRoute)
    }
  }
}
