import { describe, expect, it, vi } from 'vitest'

vi.mock('@/helpers/convert-date', () => ({
  formatDateToUSBilling: (dateOnly) => {
    if (!dateOnly || typeof dateOnly !== 'string') return '---'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return '---'
    const [year, month, day] = dateOnly.split('-')
    return `${month}/${day}/${year}`
  }
}))

const {
  findPlanById,
  findPricingById,
  formatPlanStartDate,
  isActiveServiceOrder,
  resolvePlanSku,
  toFiniteNumber
} = await import('@/composables/subscription-helpers')

const plans = [
  {
    id: 'plan-hobby',
    sku: 'HOBBY',
    pricings: []
  },
  {
    id: 'plan-pro',
    sku: 'Pro',
    pricings: [
      { id: 'price-monthly', periodicity: 'monthly', priceValue: '49.00' },
      { id: 'price-yearly', periodicity: 'yearly', priceValue: '490.00' }
    ]
  }
]

describe('isActiveServiceOrder', () => {
  it('returns true only for ACTIVE status', () => {
    expect(isActiveServiceOrder({ status: 'ACTIVE' })).toBe(true)
    expect(isActiveServiceOrder({ status: 'DRAFT' })).toBe(false)
    expect(isActiveServiceOrder(null)).toBe(false)
    expect(isActiveServiceOrder(undefined)).toBe(false)
  })
})

describe('findPlanById', () => {
  it('returns the matching plan', () => {
    expect(findPlanById(plans, 'plan-pro')).toBe(plans[1])
  })

  it('returns null for unknown plan or invalid input', () => {
    expect(findPlanById(plans, 'plan-missing')).toBeNull()
    expect(findPlanById(plans, null)).toBeNull()
    expect(findPlanById(null, 'plan-pro')).toBeNull()
  })
})

describe('findPricingById', () => {
  it('finds a pricing nested under a plan', () => {
    expect(findPricingById(plans, 'price-yearly')).toEqual({
      id: 'price-yearly',
      periodicity: 'yearly',
      priceValue: '490.00'
    })
  })

  it('returns null when not found', () => {
    expect(findPricingById(plans, 'price-missing')).toBeNull()
    expect(findPricingById(plans, null)).toBeNull()
    expect(findPricingById(null, 'price-monthly')).toBeNull()
  })
})

describe('resolvePlanSku', () => {
  it('lowercases the sku', () => {
    expect(resolvePlanSku({ sku: 'Pro' })).toBe('pro')
    expect(resolvePlanSku({ sku: 'HOBBY' })).toBe('hobby')
  })

  it('returns null when sku is missing', () => {
    expect(resolvePlanSku({})).toBeNull()
    expect(resolvePlanSku(null)).toBeNull()
  })
})

describe('toFiniteNumber', () => {
  it('parses numeric strings', () => {
    expect(toFiniteNumber('49.00')).toBe(49)
    expect(toFiniteNumber(42)).toBe(42)
  })

  it('falls back when not a finite number', () => {
    expect(toFiniteNumber(undefined, 0)).toBe(0)
    expect(toFiniteNumber('not-a-number', 7)).toBe(7)
    expect(toFiniteNumber(Number.POSITIVE_INFINITY, 0)).toBe(0)
  })
})

describe('formatPlanStartDate', () => {
  it('slices ISO timestamps to YYYY-MM-DD before formatting', () => {
    expect(formatPlanStartDate('2026-05-14T10:00:00Z')).toBe('05/14/2026')
  })

  it('formats date-only strings', () => {
    expect(formatPlanStartDate('2026-01-01')).toBe('01/01/2026')
  })

  it('returns null when format helper signals invalid', () => {
    expect(formatPlanStartDate('garbage')).toBeNull()
    expect(formatPlanStartDate(null)).toBeNull()
    expect(formatPlanStartDate(undefined)).toBeNull()
  })
})
