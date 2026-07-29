import { describe, expect, it } from 'vitest'
import { PLANS_MOCK_RESPONSE } from '@/services/v2/products/plans-mock'
import { ProductsPlansAdapter } from '@/services/v2/products/plans-adapter'
import {
  getPlanIdFromSku,
  getPlanPricingIdFromSku
} from '@/composables/signup-checkout-preparation'
import { SubscriptionsAdapter } from '@/services/v2/billing-api/subscriptions/subscriptions-adapter'

const wirePlans = PLANS_MOCK_RESPONSE.results
const plans = ProductsPlansAdapter.transformPlansList(PLANS_MOCK_RESPONSE)

const cases = wirePlans.flatMap((wirePlan) =>
  wirePlan.pricings.map((wirePricing) => ({
    sku: wirePlan.sku,
    periodicity: wirePricing.periodicity,
    expectedPlanId: wirePlan.plan_id,
    expectedPlanPricingId: wirePricing.plan_pricing_id
  }))
)

describe('subscription create payload maps the catalogue ids one-to-one', () => {
  it.each(cases)(
    '$sku/$periodicity sends the plan_id and the matching plan_pricing_id',
    ({ sku, periodicity, expectedPlanId, expectedPlanPricingId }) => {
      const body = SubscriptionsAdapter.toCreatePayload({
        planId: getPlanIdFromSku(plans, sku),
        planPricingId: getPlanPricingIdFromSku(plans, sku, periodicity)
      })

      expect(body).toEqual({
        plan_id: expectedPlanId,
        plan_pricing_id: expectedPlanPricingId
      })
      expect(body.plan_pricing_id).not.toBe(body.plan_id)
    }
  )

  it('never reuses a plan_id as a plan_pricing_id across the catalogue', () => {
    const planIds = new Set(wirePlans.map((plan) => plan.plan_id))
    const pricingIds = wirePlans.flatMap((plan) =>
      plan.pricings.map((pricing) => pricing.plan_pricing_id)
    )

    expect(pricingIds.filter((id) => planIds.has(id))).toEqual([])
  })

  it('keeps the two ids distinct for the same plan on both cycles', () => {
    const pro = plans.find((plan) => plan.sku === 'pro')
    const monthly = getPlanPricingIdFromSku(plans, 'pro', 'monthly')
    const yearly = getPlanPricingIdFromSku(plans, 'pro', 'yearly')

    expect(monthly).not.toBe(yearly)
    expect(monthly).not.toBe(pro.id)
    expect(yearly).not.toBe(pro.id)
  })
})
