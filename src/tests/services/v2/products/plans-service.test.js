import { describe, expect, it } from 'vitest'
import { productsPlansService } from '@/services/v2/products/plans-service'
import { ProductsPlansAdapter } from '@/services/v2/products/plans-adapter'

describe('ProductsPlansService.listPlans (static plans catalog)', () => {
  it('returns the catalogue transformed to the app plan shape', async () => {
    const plans = await productsPlansService.listPlans()

    expect(plans).toHaveLength(4)
    const bySku = Object.fromEntries(plans.map((plan) => [plan.sku, plan]))
    expect(Object.keys(bySku).sort()).toEqual(['enterprise', 'hobby', 'pro', 'scale'])

    const pro = bySku.pro
    expect(pro.id).toBe('019c9fa2-ee78-7a7a-a266-796f750d8261')
    expect(pro.isPublicCatalog).toBe(true)
    expect(pro.allowSelfService).toBe(true)
    const proMonthly = pro.pricings.find((pricing) => pricing.periodicity === 'monthly')
    const proYearly = pro.pricings.find((pricing) => pricing.periodicity === 'yearly')
    expect(proMonthly.priceValue).toBe(25)
    expect(proYearly.priceValue).toBe(240)
    expect(proMonthly.id).toBe('019c9fa2-ee75-743c-8b0b-a1de319b9bfb')

    expect(bySku.hobby.type).toBe('free')
    expect(bySku.scale.active).toBe(false)
    expect(bySku.enterprise.supportsOnDemand).toBe(true)
    expect(bySku.enterprise.pricings).toEqual([])
  })
})

describe('ProductsPlansAdapter.transformPlansList', () => {
  it('maps plan_id/plan_pricing_id and reads the results envelope', () => {
    const result = ProductsPlansAdapter.transformPlansList({
      results: [
        {
          plan_id: 'plan-1',
          sku: 'pro',
          name: 'Pro',
          supports_on_demand: true,
          supports_spend_management: false,
          audit: { last_editor: 'x', last_modified: 'm', created_at: 'c' },
          pricings: [
            {
              plan_pricing_id: 'pp-1',
              currency_code: 'USD',
              price_value: 25,
              periodicity: 'monthly'
            }
          ]
        }
      ]
    })

    expect(result[0].id).toBe('plan-1')
    expect(result[0].supportsOnDemand).toBe(true)
    expect(result[0].audit).toEqual({ lastEditor: 'x', lastModified: 'm', createdAt: 'c' })
    expect(result[0].pricings[0]).toEqual({
      id: 'pp-1',
      currencyCode: 'USD',
      priceValue: 25,
      periodicity: 'monthly',
      active: undefined,
      validFrom: undefined
    })
  })

  it('returns an empty list for a malformed payload', () => {
    expect(ProductsPlansAdapter.transformPlansList(undefined)).toEqual([])
    expect(ProductsPlansAdapter.transformPlansList({})).toEqual([])
  })
})
