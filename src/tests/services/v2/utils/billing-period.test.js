import { describe, expect, it } from 'vitest'
import {
  toBillingPeriod,
  toCataloguePeriodicity,
  isAnnualPeriod,
  CATALOGUE_PERIODICITY
} from '@/services/v2/utils/billing-period'
import { BILLING_PERIOD } from '@/services/v2/billing-api/subscriptions/subscriptions-constants'

describe('toBillingPeriod', () => {
  it('translates the catalogue vocabulary to the billing-api one', () => {
    expect(toBillingPeriod(CATALOGUE_PERIODICITY.MONTHLY)).toBe(BILLING_PERIOD.MONTHLY)
    expect(toBillingPeriod(CATALOGUE_PERIODICITY.YEARLY)).toBe(BILLING_PERIOD.ANNUAL)
  })

  it('is idempotent for values already in the billing-api vocabulary', () => {
    expect(toBillingPeriod(BILLING_PERIOD.MONTHLY)).toBe(BILLING_PERIOD.MONTHLY)
    expect(toBillingPeriod(BILLING_PERIOD.ANNUAL)).toBe(BILLING_PERIOD.ANNUAL)
  })

  it('is case insensitive', () => {
    expect(toBillingPeriod('Yearly')).toBe(BILLING_PERIOD.ANNUAL)
    expect(toBillingPeriod('MONTHLY')).toBe(BILLING_PERIOD.MONTHLY)
  })

  it('returns null for unknown, empty or nullish input', () => {
    expect(toBillingPeriod('weekly')).toBeNull()
    expect(toBillingPeriod('')).toBeNull()
    expect(toBillingPeriod(null)).toBeNull()
    expect(toBillingPeriod(undefined)).toBeNull()
  })
})

describe('toCataloguePeriodicity', () => {
  it('translates the billing-api vocabulary back to the catalogue one', () => {
    expect(toCataloguePeriodicity(BILLING_PERIOD.MONTHLY)).toBe(CATALOGUE_PERIODICITY.MONTHLY)
    expect(toCataloguePeriodicity(BILLING_PERIOD.ANNUAL)).toBe(CATALOGUE_PERIODICITY.YEARLY)
  })

  it('is idempotent for values already in the catalogue vocabulary', () => {
    expect(toCataloguePeriodicity(CATALOGUE_PERIODICITY.YEARLY)).toBe(CATALOGUE_PERIODICITY.YEARLY)
  })

  it('returns null for unknown input', () => {
    expect(toCataloguePeriodicity('biannual')).toBeNull()
    expect(toCataloguePeriodicity(null)).toBeNull()
  })
})

describe('isAnnualPeriod', () => {
  it('accepts both vocabularies', () => {
    expect(isAnnualPeriod('yearly')).toBe(true)
    expect(isAnnualPeriod('annual')).toBe(true)
  })

  it('is false for monthly and for unknown values', () => {
    expect(isAnnualPeriod('monthly')).toBe(false)
    expect(isAnnualPeriod('whatever')).toBe(false)
    expect(isAnnualPeriod(null)).toBe(false)
  })
})
