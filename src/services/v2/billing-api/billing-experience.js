import { ACCOUNT_MODE } from './subscriptions/subscriptions-constants'

export const BILLING_EXPERIENCE = Object.freeze({
  PLAN: 'plan',
  INTERNAL: 'internal',
  CUSTOM: 'custom'
})

export const MANAGED_BILLING_EXPERIENCES = Object.freeze([
  BILLING_EXPERIENCE.INTERNAL,
  BILLING_EXPERIENCE.CUSTOM
])

const PLANS_BILLING_TYPES = Object.freeze([null, BILLING_EXPERIENCE.PLAN])

export const resolveBillingExperience = ({
  billingType = null,
  accountMode = null,
  isOverridden = false
} = {}) => {
  const billingTypeValue = billingType ?? null

  if (!PLANS_BILLING_TYPES.includes(billingTypeValue)) return billingTypeValue
  if (!isOverridden && accountMode === ACCOUNT_MODE.CUSTOM) return BILLING_EXPERIENCE.CUSTOM

  return BILLING_EXPERIENCE.PLAN
}
