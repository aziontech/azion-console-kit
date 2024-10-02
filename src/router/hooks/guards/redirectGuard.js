import { getRedirectRoute } from '@/helpers'

/** @type {import('vue-router').NavigationGuardWithThis} */
export function redirectGuard({ to, router }) {
  if (to.name === 'home') {
    const redirectRoute = getRedirectRoute(router)
    if (redirectRoute) {
      return redirectRoute
    }
  }
}
