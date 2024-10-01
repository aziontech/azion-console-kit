import { billingRoutes } from '@/router/routes/billing-routes'
import { getStaticUrlsByEnvironment } from '@/helpers'

const BILLING_REDIRECT_OPTIONS = {
  path: `${billingRoutes.path}/payment`,
  query: { paymentSession: 'true' }
}

const billingUrl = getStaticUrlsByEnvironment('billing')

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function billingGuard(to, next, accountStore) {
  const {
    hasActiveUserId,
    redirectToExternalBillingNeeded,
    billingAccessPermitted,
    paymentReviewPending
  } = accountStore

  const isPrivateRoute = !to.meta.isPublic
  const isCurrentRouteBilling = to.fullPath.includes(billingRoutes.path)

  if (isPrivateRoute && hasActiveUserId) {
    if (isCurrentRouteBilling) {
      if (redirectToExternalBillingNeeded) {
        window.open(billingUrl, '_blank')
        return next(false)
      }

      if (!billingAccessPermitted) {
        return next('/')
      }
    } else if (paymentReviewPending) {
      return next(BILLING_REDIRECT_OPTIONS)
    }
  }
}
