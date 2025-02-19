import { billingRoutes } from '@/router/routes/billing-routes'

const BILLING_REDIRECT_OPTIONS = {
  path: `${billingRoutes.path}/payment`,
  query: { paymentSession: 'true' }
}

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function billingGuard({ to, accountStore }) {
  const { hasActiveUserId, billingAccessPermitted, paymentReviewPending } = accountStore

  const isPrivateRoute = !to.meta.isPublic
  const isCurrentRouteBilling = to.fullPath.includes(billingRoutes.path)

  if (isPrivateRoute && hasActiveUserId) {
    if (isCurrentRouteBilling) {
      if (!billingAccessPermitted) {
        return '/'
      }

      if (to.name === 'billing-tabs') {
        return true
      }

      if (to.name === 'account-settings') {
        return true
      }
    } else if (paymentReviewPending) {
      return BILLING_REDIRECT_OPTIONS
    }
  }
}
