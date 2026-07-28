import { toBillingPeriod } from '@/services/v2/utils/billing-period'

export const extractCheckoutClientSecret = (response) =>
  response?.payment?.clientSecret || response?.data?.payment?.client_secret || ''

const findPlanBySku = (plans, plan) => {
  if (!Array.isArray(plans) || !plan) return null
  return plans.find((item) => item.sku?.toLowerCase() === plan.toLowerCase()) ?? null
}

export const getPlanIdFromSku = (plans, plan) => findPlanBySku(plans, plan)?.id ?? null

const resolvePlanPayload = ({ plans, plan, billingCycle }) => {
  const planId = getPlanIdFromSku(plans, plan)
  if (!planId) {
    throw new Error(`Plan not found for ${plan}.`)
  }

  const period = toBillingPeriod(billingCycle) ?? toBillingPeriod('monthly')
  if (!period) {
    throw new Error(`Plan pricing not found for ${plan} (${billingCycle}).`)
  }

  return { planId, period }
}

/**
 * Creates the subscription for a paid signup and hands back the client secret
 * of the first payment. `POST /v4/account/subscriptions` returns the
 * subscription as `incomplete` plus `payment.client_secret`; the gateway only
 * collects — activation happens server-side once the payment settles.
 */
export const preparePaidSignupCheckout = async ({
  plan,
  billingCycle,
  plans,
  createSubscription
}) => {
  if (plan !== 'pro') {
    return { clientSecret: '', subscription: null }
  }

  const response = await createSubscription(resolvePlanPayload({ plans, plan, billingCycle }))
  const clientSecret = extractCheckoutClientSecret(response)

  if (!clientSecret) {
    throw new Error('Payment session client secret missing in response.')
  }

  return { clientSecret, subscription: response?.subscription ?? null }
}

export const submitSignupPlan = async ({ plan, billingCycle, plans, createSubscription }) => {
  const response = await createSubscription(resolvePlanPayload({ plans, plan, billingCycle }))

  return {
    response,
    payment: plan === 'pro' ? { clientSecret: extractCheckoutClientSecret(response) } : null,
    subscription: response?.subscription ?? null
  }
}
