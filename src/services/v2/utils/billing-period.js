import { BILLING_PERIOD } from '@/services/v2/billing-api/subscriptions/subscriptions-constants'

export const CATALOGUE_PERIODICITY = Object.freeze({
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
})

const CATALOGUE_TO_API = Object.freeze({
  [CATALOGUE_PERIODICITY.MONTHLY]: BILLING_PERIOD.MONTHLY,
  [CATALOGUE_PERIODICITY.YEARLY]: BILLING_PERIOD.ANNUAL,
  [BILLING_PERIOD.ANNUAL]: BILLING_PERIOD.ANNUAL
})

const API_TO_CATALOGUE = Object.freeze({
  [BILLING_PERIOD.MONTHLY]: CATALOGUE_PERIODICITY.MONTHLY,
  [BILLING_PERIOD.ANNUAL]: CATALOGUE_PERIODICITY.YEARLY,
  [CATALOGUE_PERIODICITY.YEARLY]: CATALOGUE_PERIODICITY.YEARLY
})

const normalize = (value) => (value == null ? '' : String(value).toLowerCase())

export const toBillingPeriod = (periodicity) => CATALOGUE_TO_API[normalize(periodicity)] ?? null

export const toCataloguePeriodicity = (period) => API_TO_CATALOGUE[normalize(period)] ?? null

export const isAnnualPeriod = (value) => toBillingPeriod(value) === BILLING_PERIOD.ANNUAL
