import { getRedirectRoute } from '@/helpers'
import { handleCLIRedirect } from '@/helpers/redirect-cli'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function redirectGuard({ to, router }) {
  if (to.name === 'home') {
    const redirectUrl = await handleCLIRedirect()

    if (redirectUrl) {
      window.location.assign(redirectUrl)
      return false
    }

    const redirectRoute = getRedirectRoute(router)
    if (redirectRoute) {
      return redirectRoute
    }

    return true
  }
}
