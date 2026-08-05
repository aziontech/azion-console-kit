import { describe, expect, it } from 'vitest'
import plansCatalog from '@/services/v2/products/plans.json'
import { ProductsPlansAdapter } from '@/services/v2/products/plans-adapter'
import { getPlanIdFromSku } from '@/composables/signup-checkout-preparation'
import { toBillingPeriod } from '@/services/v2/utils/billing-period'
import { SubscriptionsAdapter } from '@/services/v2/billing-api/subscriptions/subscriptions-adapter'

const wirePlans = plansCatalog.results
const plans = ProductsPlansAdapter.transformPlansList(plansCatalog)

const cases = wirePlans.flatMap((wirePlan) =>
  wirePlan.pricings.map((wirePricing) => ({
    sku: wirePlan.sku,
    periodicity: wirePricing.periodicity,
    expectedPlanId: wirePlan.plan_id,
    expectedPeriod: wirePricing.periodicity === 'yearly' ? 'annual' : 'monthly'
  }))
)

describe('subscription create payload carries the plan and its period', () => {
  it.each(cases)(
    '$sku/$periodicity sends the plan_id and the matching period',
    ({ sku, periodicity, expectedPlanId, expectedPeriod }) => {
      const body = SubscriptionsAdapter.toCreatePayload({
        planId: getPlanIdFromSku(plans, sku),
        period: toBillingPeriod(periodicity)
      })

      expect(body).toEqual({
        plan_id: expectedPlanId,
        period: expectedPeriod
      })
    }
  )

  it('never sends a plan_pricing_id — the pricing is a server-side snapshot in v4', () => {
    const body = SubscriptionsAdapter.toCreatePayload({
      planId: getPlanIdFromSku(plans, 'pro'),
      period: toBillingPeriod('yearly')
    })

    expect(body).not.toHaveProperty('plan_pricing_id')
    expect(Object.keys(body)).toEqual(['plan_id', 'period'])
  })

  it('maps both catalogue cycles of the same plan onto distinct periods', () => {
    const planId = getPlanIdFromSku(plans, 'pro')

    expect(
      SubscriptionsAdapter.toCreatePayload({ planId, period: toBillingPeriod('monthly') })
    ).toEqual({ plan_id: planId, period: 'monthly' })
    expect(
      SubscriptionsAdapter.toCreatePayload({ planId, period: toBillingPeriod('yearly') })
    ).toEqual({ plan_id: planId, period: 'annual' })
  })
})
