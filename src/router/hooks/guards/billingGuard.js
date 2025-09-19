const BILLING_PATH = '/billing'

const BILLING_REDIRECT_OPTIONS = {
  path: `${BILLING_PATH}/bills`,
  query: { paymentSession: 'true' }
}

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function billingGuard({ to, accountStore }) {
  const { hasActiveUserId, billingAccessPermitted, paymentReviewPending } = accountStore

  if (to.meta.isPublic || !hasActiveUserId) {
    return true
  }

  const isBillingRoute = to.fullPath.includes(BILLING_PATH)

  if (isBillingRoute) {
    if (!billingAccessPermitted) {
      return '/'
    }

    return true
  }

  if (paymentReviewPending) {
    return BILLING_REDIRECT_OPTIONS
  }

  return
}
