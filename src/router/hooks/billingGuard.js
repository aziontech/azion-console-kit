import { useAccountStore } from '@/stores/account'
import { billingRoutes } from '@/router/routes/billing-routes'
import { getStaticUrlsByEnvironment } from '@/helpers'

const ACCOUNT_STATUSES = {
  PAYMENT_REVIEW_REQUIRED: ['BLOCKED', 'DEFAULTING'],
  BILLING_ACCESS_ALLOWED: ['BLOCKED', 'DEFAULTING', 'TRIAL', 'ONLINE'],
  EXTERNAL_REDIRECT_REQUIRED: ['REGULAR']
}

const BILLING_REDIRECT_OPTIONS = {
  path: `${billingRoutes.path}/payment`,
  query: { paymentSession: 'true' }
}

const billingUrl = getStaticUrlsByEnvironment('billing')

/** @type {import('vue-router').NavigationGuardWithThis} */
export default async function billingGuard(to, __, next) {
  const accountStore = useAccountStore()
  const { accountStatus, hasActiveUserId } = accountStore

  const isPrivateRoute = !to.meta.isPublic
  const isCurrentRouteBilling = to.fullPath.includes(billingRoutes.path)

  const shouldRedirectToExternalBilling =
    ACCOUNT_STATUSES.EXTERNAL_REDIRECT_REQUIRED.includes(accountStatus)
  const isBillingAccessAllowed = !ACCOUNT_STATUSES.BILLING_ACCESS_ALLOWED.includes(accountStatus)
  const isPaymentReviewRequired = ACCOUNT_STATUSES.PAYMENT_REVIEW_REQUIRED.includes(accountStatus)

  if (isPrivateRoute && hasActiveUserId) {
    if (isCurrentRouteBilling) {
      if (shouldRedirectToExternalBilling) {
        window.open(billingUrl, '_blank')
        return next('/')
      }

      if (isBillingAccessAllowed) {
        return next('/')
      }
    } else if (isPaymentReviewRequired) {
      return next(BILLING_REDIRECT_OPTIONS)
    }
  }

  return next()
}
