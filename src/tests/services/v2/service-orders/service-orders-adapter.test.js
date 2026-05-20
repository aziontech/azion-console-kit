import { describe, expect, it } from 'vitest'
import { ServiceOrdersAdapter } from '@/services/v2/service-orders/service-orders-adapter'

describe('ServiceOrdersAdapter payload serialization', () => {
  it('does not send deprecated accountId or internal fields on create', () => {
    expect(
      ServiceOrdersAdapter.toCreatePayload({
        accountId: 99999,
        planId: 'plan-1',
        planPricingId: 'price-1'
      })
    ).toEqual({
      planId: 'plan-1',
      priceId: 'price-1'
    })
  })

  it('does not send deprecated accountId or mutable service-order fields on update', () => {
    expect(
      ServiceOrdersAdapter.toUpdatePayload({
        accountId: 99999,
        planId: 'plan-1',
        planPricingId: 'price-1',
        status: 'ACTIVE',
        metadata: { status: 'downgrade_pending' }
      })
    ).toEqual({
      planId: 'plan-1',
      priceId: 'price-1'
    })
  })

  it('does not send deprecated accountId on upgrade', () => {
    expect(
      ServiceOrdersAdapter.toUpgradePayload({
        accountId: 99999,
        newPlanId: 'plan-2',
        priceId: 'price-2'
      })
    ).toEqual({
      newPlanId: 'plan-2',
      priceId: 'price-2'
    })
  })

  it('sends priceId on downgrade when target paid pricing is selected', () => {
    expect(
      ServiceOrdersAdapter.toDowngradePayload({
        accountId: 99999,
        newPlanId: 'plan-1',
        planPricingId: 'price-monthly'
      })
    ).toEqual({
      newPlanId: 'plan-1',
      priceId: 'price-monthly'
    })
  })

  it('normalizes current account service order responses', () => {
    expect(
      ServiceOrdersAdapter.transformCurrentServiceOrderResponse({
        service_order_id: 'so-1',
        plan_id: 'plan-1',
        price_id: 'price-1',
        status: 'ACTIVE'
      })
    ).toMatchObject({
      data: {
        serviceOrderId: 'so-1',
        planId: 'plan-1',
        priceId: 'price-1',
        status: 'ACTIVE'
      }
    })
  })

  it('normalizes missing current account responses as null data', () => {
    expect(ServiceOrdersAdapter.transformCurrentServiceOrderResponse({ data: null })).toEqual({
      success: false,
      data: null,
      meta: {
        count: undefined,
        total: undefined,
        limit: undefined,
        offset: undefined,
        requestId: undefined
      }
    })

    expect(ServiceOrdersAdapter.transformCurrentPlanResponse(null)).toMatchObject({
      success: false,
      data: null
    })
  })

  it('normalizes current account plan responses', () => {
    expect(
      ServiceOrdersAdapter.transformCurrentPlanResponse({
        plan_id: 'plan-1',
        sku: 'pro',
        pricings: [
          {
            plan_pricing_id: 'price-1',
            periodicity: 'monthly'
          }
        ]
      })
    ).toMatchObject({
      data: {
        id: 'plan-1',
        sku: 'pro',
        pricings: [
          {
            id: 'price-1',
            periodicity: 'monthly'
          }
        ]
      }
    })
  })

  it('normalizes cancel downgrade responses', () => {
    expect(
      ServiceOrdersAdapter.transformCancelDowngradeResponse({
        serviceOrder: {
          service_order_id: 'so-1',
          plan_id: 'plan-1',
          status: 'ACTIVE',
          metadata: {}
        },
        transition: {
          from: 'pro',
          to: 'hobby',
          type: 'downgrade'
        }
      })
    ).toMatchObject({
      serviceOrder: {
        serviceOrderId: 'so-1',
        planId: 'plan-1',
        status: 'ACTIVE'
      },
      transition: {
        from: 'pro',
        to: 'hobby',
        type: 'downgrade'
      }
    })
  })
})
