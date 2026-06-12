import { getPlanPricingId } from '@/composables/usePlansService'

export const extractCheckoutClientSecret = (response) =>
  response?.payment?.clientSecret ||
  response?.data?.clientSecret ||
  response?.data?.payment?.clientSecret ||
  response?.serviceOrder?.clientSecret ||
  ''

const findPlanBySku = (plans, plan) => {
  if (!Array.isArray(plans) || !plan) return null
  return plans.find((item) => item.sku?.toLowerCase() === plan.toLowerCase()) ?? null
}

export const getPlanIdFromSku = (plans, plan) => findPlanBySku(plans, plan)?.id ?? null

const getResponseServiceOrder = (response) =>
  response?.data || response?.serviceOrder || response?.service_order || null

const getDraftServiceOrderId = (draft) => draft?.serviceOrderId || draft?.id || null

const resolvePlanPayload = ({ plans, plan, billingCycle }) => {
  const planId = getPlanIdFromSku(plans, plan)
  if (!planId) {
    throw new Error(`Plan not found for ${plan}.`)
  }

  if (plan === 'hobby') {
    return { planId }
  }

  const planPricingId = getPlanPricingId(plans, plan, billingCycle)
  if (!planPricingId) {
    throw new Error(`Plan pricing not found for ${plan} (${billingCycle}).`)
  }

  return { planId, planPricingId }
}

export const preparePaidSignupCheckout = async ({
  plan,
  billingCycle,
  plans,
  prepareSignupCheckout
}) => {
  if (plan !== 'pro') {
    return { clientSecret: '', draftServiceOrderId: null, serviceOrder: null }
  }

  const payload = resolvePlanPayload({ plans, plan, billingCycle })
  const response = await prepareSignupCheckout(payload)

  const clientSecret = extractCheckoutClientSecret(response)
  if (!clientSecret) {
    throw new Error('Payment session client secret missing in response.')
  }

  const serviceOrder = getResponseServiceOrder(response)
  return {
    clientSecret,
    draftServiceOrderId: getDraftServiceOrderId(serviceOrder),
    serviceOrder
  }
}

export const submitSignupPlanFromDraftOrCreate = async ({
  plan,
  billingCycle,
  plans,
  prepareSignupCheckout
}) => {
  const payload = resolvePlanPayload({ plans, plan, billingCycle })
  const response = await prepareSignupCheckout(payload)
  const serviceOrder = getResponseServiceOrder(response)

  return {
    response,
    payment: plan === 'pro' ? { clientSecret: extractCheckoutClientSecret(response) } : null,
    serviceOrder,
    draftServiceOrderId: getDraftServiceOrderId(serviceOrder)
  }
}
