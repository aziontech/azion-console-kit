import { describe, expect, it } from 'vitest'
import { ServiceOrdersAdapter } from '@/services/v2/service-orders/service-orders-adapter'

const v4ServiceOrder = {
  id: 'so-uuid',
  type: 'plan_subscription',
  status: 'ACTIVE',
  plan_id: 'plan-uuid',
  plan_pricing_id: 'price-uuid',
  start_date: '2026-05-01T00:00:00Z',
  end_date: null,
  current_period_start: '2026-05-01T00:00:00Z',
  current_period_end: '2026-06-01T00:00:00Z',
  auto_renew: true,
  created_at: '2026-04-30T12:00:00Z',
  last_modified: '2026-05-01T00:00:00Z',
  last_editor: 'user@azion.com',
  product_version: '1.0'
}

const v4Transition = {
  id: 'trans-uuid',
  type: 'upgrade',
  status: 'completed',
  from_plan_id: 'plan-a',
  to_plan_id: 'plan-b',
  from_plan_pricing_id: 'price-a',
  to_plan_pricing_id: 'price-b',
  effective_immediately: true,
  prorated: true,
  scheduled_at: null,
  completed_at: '2026-05-01T00:00:00Z',
  created_at: '2026-05-01T00:00:00Z',
  last_modified: '2026-05-01T00:00:00Z',
  last_editor: 'user@azion.com'
}

describe('transformServiceOrder', () => {
  it('maps v4 snake_case wire to camelCase app shape', () => {
    const result = ServiceOrdersAdapter.transformServiceOrder(v4ServiceOrder)
    expect(result).toEqual({
      serviceOrderId: 'so-uuid',
      type: 'plan_subscription',
      status: 'ACTIVE',
      planId: 'plan-uuid',
      priceId: 'price-uuid',
      startDate: '2026-05-01T00:00:00Z',
      endDate: null,
      currentPeriodStart: '2026-05-01T00:00:00Z',
      currentPeriodEnd: '2026-06-01T00:00:00Z',
      autoRenew: true,
      createdAt: '2026-04-30T12:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
      lastEditor: 'user@azion.com',
      productVersion: '1.0',
      downgradePending: null,
      invoiceAmountCharged: null,
      clientSecret: null,
      checkoutSessionId: null
    })
  })

  it('extracts client_secret from data.payment container (DRAFT with checkout)', () => {
    const draft = { ...v4ServiceOrder, status: 'DRAFT', payment: { client_secret: 'seti_xxx' } }
    const result = ServiceOrdersAdapter.transformServiceOrder(draft)
    expect(result.clientSecret).toBe('seti_xxx')
  })

  describe('downgradePending derivation', () => {
    it('returns null when neither pending_transition nor metadata are present', () => {
      const result = ServiceOrdersAdapter.transformServiceOrder(v4ServiceOrder)
      expect(result.downgradePending).toBeNull()
    })

    it('reads from pending_transition (PR #96) when present', () => {
      const data = {
        ...v4ServiceOrder,
        pending_transition: {
          type: 'downgrade',
          to_plan_id: 'plan-free',
          to_plan_pricing_id: null,
          effective_date: '2026-06-30T23:59:59.000Z'
        }
      }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).downgradePending).toEqual({
        type: 'downgrade',
        toPlanId: 'plan-free',
        toPriceId: null,
        effectiveAt: '2026-06-30T23:59:59.000Z',
        mode: null
      })
    })

    it('maps pending_transition with paid downgrade target', () => {
      const data = {
        ...v4ServiceOrder,
        pending_transition: {
          type: 'downgrade',
          to_plan_id: 'plan-pro-monthly',
          to_plan_pricing_id: 'price_xxx',
          effective_date: '2026-06-01T00:00:00Z'
        }
      }
      const result = ServiceOrdersAdapter.transformServiceOrder(data).downgradePending
      expect(result.toPriceId).toBe('price_xxx')
      expect(result.effectiveAt).toBe('2026-06-01T00:00:00Z')
    })

    it('falls back to legacy downgrade_pending field when present', () => {
      const data = {
        ...v4ServiceOrder,
        downgrade_pending: { effective_at: '2026-06-01T00:00:00Z', mode: 'cancel_at_period_end' }
      }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).downgradePending).toEqual({
        type: 'downgrade',
        toPlanId: null,
        toPriceId: null,
        effectiveAt: '2026-06-01T00:00:00Z',
        mode: 'cancel_at_period_end'
      })
    })

    it('falls back to metadata.status=downgrade_pending shape', () => {
      const data = {
        ...v4ServiceOrder,
        metadata: { status: 'downgrade_pending', effective_date: '2026-06-15T00:00:00Z' }
      }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).downgradePending).toEqual({
        type: 'downgrade',
        toPlanId: null,
        toPriceId: null,
        effectiveAt: '2026-06-15T00:00:00Z',
        mode: null
      })
    })

    it('accepts camelCase metadata.effectiveDate variant', () => {
      const data = {
        ...v4ServiceOrder,
        metadata: { status: 'downgrade_pending', effectiveDate: '2026-07-01T00:00:00Z' }
      }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).downgradePending.effectiveAt).toBe(
        '2026-07-01T00:00:00Z'
      )
    })

    it('returns null when metadata exists but status is not downgrade_pending', () => {
      const data = { ...v4ServiceOrder, metadata: { status: 'active' } }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).downgradePending).toBeNull()
    })
  })

  describe('invoiceAmountCharged derivation', () => {
    it('returns null when no source is present', () => {
      expect(
        ServiceOrdersAdapter.transformServiceOrder(v4ServiceOrder).invoiceAmountCharged
      ).toBeNull()
    })

    it('reads from future-shape current_invoice_amount_charged', () => {
      const data = { ...v4ServiceOrder, current_invoice_amount_charged: 1234 }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).invoiceAmountCharged).toBe(1234)
    })

    it('falls back to metadata.amount_charged', () => {
      const data = { ...v4ServiceOrder, metadata: { amount_charged: 99.5 } }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).invoiceAmountCharged).toBe(99.5)
    })

    it('accepts metadata.amountCharged camelCase variant', () => {
      const data = { ...v4ServiceOrder, metadata: { amountCharged: 50 } }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).invoiceAmountCharged).toBe(50)
    })

    it('returns null for non-finite values', () => {
      const data = { ...v4ServiceOrder, current_invoice_amount_charged: 'not a number' }
      expect(ServiceOrdersAdapter.transformServiceOrder(data).invoiceAmountCharged).toBeNull()
    })
  })
})

describe('transformTransition', () => {
  it('maps v4 snake_case transition to camelCase', () => {
    expect(ServiceOrdersAdapter.transformTransition(v4Transition)).toEqual({
      id: 'trans-uuid',
      type: 'upgrade',
      status: 'completed',
      fromPlanId: 'plan-a',
      toPlanId: 'plan-b',
      fromPriceId: 'price-a',
      toPriceId: 'price-b',
      effectiveImmediately: true,
      prorated: true,
      scheduledAt: null,
      completedAt: '2026-05-01T00:00:00Z',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
      lastEditor: 'user@azion.com'
    })
  })

  it('returns null for missing/invalid transition', () => {
    expect(ServiceOrdersAdapter.transformTransition(null)).toBeNull()
    expect(ServiceOrdersAdapter.transformTransition(undefined)).toBeNull()
  })
})

describe('transformListResponse', () => {
  it('unwraps v4 offset envelope (count, total_pages, page, page_size, next, previous, results)', () => {
    const envelope = {
      count: 2,
      total_pages: 1,
      page: 1,
      page_size: 20,
      next: null,
      previous: null,
      results: [v4ServiceOrder, { ...v4ServiceOrder, id: 'so-2' }]
    }
    const result = ServiceOrdersAdapter.transformListResponse(envelope)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].serviceOrderId).toBe('so-uuid')
    expect(result.meta).toEqual({
      count: 2,
      totalPages: 1,
      page: 1,
      pageSize: 20,
      next: null,
      previous: null
    })
  })

  it('returns empty data when results is missing', () => {
    expect(ServiceOrdersAdapter.transformListResponse({}).data).toEqual([])
  })
})

describe('transformDetailResponse', () => {
  it('unwraps { state, data } envelope', () => {
    const result = ServiceOrdersAdapter.transformDetailResponse({
      state: 'executed',
      data: v4ServiceOrder
    })
    expect(result.state).toBe('executed')
    expect(result.data.serviceOrderId).toBe('so-uuid')
  })

  it('returns null data when envelope has no data', () => {
    expect(ServiceOrdersAdapter.transformDetailResponse({ state: 'executed' })).toEqual({
      state: 'executed',
      data: null
    })
  })
})

describe('transformUpgradeResponse', () => {
  it('maps service_order + transition + plan + immediate_update + proration', () => {
    const envelope = {
      state: 'executed',
      data: {
        service_order: { ...v4ServiceOrder, payment: { client_secret: 'seti_up' } },
        transition: v4Transition,
        plan: {
          id: 'plan-b',
          name: 'Pro',
          slug: 'pro',
          sku: 'pro',
          active: true,
          sort_order: 10,
          pricings: [
            { id: 'price-b', currency_code: 'USD', price_value: 99, periodicity: 'monthly' }
          ]
        },
        immediate_update: true,
        proration: { amount_due: 1234, currency: 'USD' }
      }
    }
    const result = ServiceOrdersAdapter.transformUpgradeResponse(envelope)
    expect(result.state).toBe('executed')
    expect(result.serviceOrder.serviceOrderId).toBe('so-uuid')
    expect(result.serviceOrder.clientSecret).toBe('seti_up')
    expect(result.transition.type).toBe('upgrade')
    expect(result.plan.id).toBe('plan-b')
    expect(result.plan.pricings[0].id).toBe('price-b')
    expect(result.immediate).toBe(true)
    expect(result.proration).toEqual({ amountDue: 1234, currency: 'USD' })
  })

  it('handles non-immediate upgrade (checkout path) with no proration', () => {
    const envelope = {
      state: 'executed',
      data: {
        service_order: {
          ...v4ServiceOrder,
          status: 'DRAFT',
          payment: { client_secret: 'seti_chk' }
        },
        transition: { ...v4Transition, status: 'pending' },
        plan: { id: 'plan-b', name: 'Pro', active: true, sort_order: 10, pricings: [] },
        immediate_update: false
      }
    }
    const result = ServiceOrdersAdapter.transformUpgradeResponse(envelope)
    expect(result.immediate).toBe(false)
    expect(result.proration).toBeNull()
    expect(result.serviceOrder.clientSecret).toBe('seti_chk')
  })
})

describe('transformDowngradeResponse', () => {
  it('maps downgrade-to-free (mode=cancel_at_period_end)', () => {
    const envelope = {
      state: 'executed',
      data: {
        service_order: v4ServiceOrder,
        transition: { ...v4Transition, type: 'downgrade', to_plan_pricing_id: null },
        mode: 'cancel_at_period_end',
        cancel_at_period_end: true,
        effective_date: '2026-06-01T00:00:00Z'
      }
    }
    const result = ServiceOrdersAdapter.transformDowngradeResponse(envelope)
    expect(result.mode).toBe('cancel_at_period_end')
    expect(result.cancelAtPeriodEnd).toBe(true)
    expect(result.effectiveDate).toBe('2026-06-01T00:00:00Z')
    expect(result.subscriptionScheduleId).toBeNull()
    expect(result.transition.toPriceId).toBeNull()
  })

  it('maps downgrade-to-paid (mode=schedule)', () => {
    const envelope = {
      state: 'executed',
      data: {
        service_order: v4ServiceOrder,
        transition: { ...v4Transition, type: 'downgrade' },
        mode: 'schedule',
        subscription_schedule_id: 'sub_sched_xxx'
      }
    }
    const result = ServiceOrdersAdapter.transformDowngradeResponse(envelope)
    expect(result.mode).toBe('schedule')
    expect(result.subscriptionScheduleId).toBe('sub_sched_xxx')
    expect(result.cancelAtPeriodEnd).toBeNull()
    expect(result.effectiveDate).toBeNull()
  })
})

describe('transformCancelResponse', () => {
  it('includes cancel_at_period_end flag', () => {
    const envelope = {
      state: 'executed',
      data: {
        service_order: v4ServiceOrder,
        transition: { ...v4Transition, type: 'cancel', status: 'pending' },
        cancel_at_period_end: true
      }
    }
    const result = ServiceOrdersAdapter.transformCancelResponse(envelope)
    expect(result.cancelAtPeriodEnd).toBe(true)
    expect(result.transition.type).toBe('cancel')
  })

  it('handles free cancel (immediate, cancel_at_period_end=false)', () => {
    const envelope = {
      state: 'executed',
      data: {
        service_order: { ...v4ServiceOrder, status: 'CANCELED' },
        transition: { ...v4Transition, type: 'cancel', status: 'completed' },
        cancel_at_period_end: false
      }
    }
    const result = ServiceOrdersAdapter.transformCancelResponse(envelope)
    expect(result.cancelAtPeriodEnd).toBe(false)
    expect(result.serviceOrder.status).toBe('CANCELED')
  })
})

describe('transformCancelDowngradeResponse', () => {
  it('returns only service_order + transition (no mode/cancel_at_period_end)', () => {
    const envelope = {
      state: 'executed',
      data: {
        service_order: v4ServiceOrder,
        transition: { ...v4Transition, type: 'downgrade', status: 'canceled' }
      }
    }
    const result = ServiceOrdersAdapter.transformCancelDowngradeResponse(envelope)
    expect(result.serviceOrder.serviceOrderId).toBe('so-uuid')
    expect(result.transition.status).toBe('canceled')
    expect(result).not.toHaveProperty('mode')
    expect(result).not.toHaveProperty('cancelAtPeriodEnd')
  })
})

describe('transformBillingPaymentMethodsResponse', () => {
  const v4Envelope = {
    state: 'executed',
    data: {
      object: 'list',
      payment_methods: [
        {
          id: 'pm_xxx',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2030,
          funding: 'credit',
          country: 'US',
          is_default: true
        },
        {
          id: 'pm_yyy',
          type: 'card',
          brand: 'mastercard',
          last4: '5151',
          exp_month: 6,
          exp_year: 2028,
          funding: 'debit',
          country: 'BR',
          is_default: false
        }
      ],
      billing_address: {
        line1: '123 Main St',
        line2: null,
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94107',
        country: 'US'
      },
      customer_email: 'user@example.com',
      customer_name: 'Test User',
      stale: false
    }
  }

  it('maps payment methods list with default flag', () => {
    const result = ServiceOrdersAdapter.transformBillingPaymentMethodsResponse(v4Envelope)
    expect(result.paymentMethods).toHaveLength(2)
    expect(result.paymentMethods[0]).toEqual({
      id: 'pm_xxx',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
      funding: 'credit',
      country: 'US',
      isDefault: true
    })
    expect(result.paymentMethods[1].isDefault).toBe(false)
  })

  it('identifies defaultPaymentMethod from is_default flag', () => {
    const result = ServiceOrdersAdapter.transformBillingPaymentMethodsResponse(v4Envelope)
    expect(result.defaultPaymentMethod?.id).toBe('pm_xxx')
    expect(result.defaultPaymentMethod?.last4).toBe('4242')
  })

  it('returns null defaultPaymentMethod when none flagged', () => {
    const envelope = {
      state: 'executed',
      data: {
        object: 'list',
        payment_methods: [{ id: 'pm_a', type: 'card', brand: 'visa', last4: '0001' }]
      }
    }
    const result = ServiceOrdersAdapter.transformBillingPaymentMethodsResponse(envelope)
    expect(result.defaultPaymentMethod).toBeNull()
    expect(result.paymentMethods[0].isDefault).toBe(false)
  })

  it('maps billing_address to camelCase', () => {
    const result = ServiceOrdersAdapter.transformBillingPaymentMethodsResponse(v4Envelope)
    expect(result.billingAddress).toEqual({
      line1: '123 Main St',
      line2: null,
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107',
      country: 'US'
    })
  })

  it('returns empty list when payment_methods absent', () => {
    const result = ServiceOrdersAdapter.transformBillingPaymentMethodsResponse({
      state: 'executed',
      data: {}
    })
    expect(result.paymentMethods).toEqual([])
    expect(result.defaultPaymentMethod).toBeNull()
  })

  it('preserves stale flag from snapshot fallback', () => {
    const envelope = { state: 'executed', data: { payment_methods: [], stale: true } }
    expect(ServiceOrdersAdapter.transformBillingPaymentMethodsResponse(envelope).stale).toBe(true)
  })
})

describe('toCreatePayload / toUpdatePayload', () => {
  it('converts camelCase to snake_case with strict allowed fields', () => {
    expect(
      ServiceOrdersAdapter.toCreatePayload({ planId: 'plan-1', planPricingId: 'price-1' })
    ).toEqual({ plan_id: 'plan-1', plan_pricing_id: 'price-1' })
  })

  it('omits plan_pricing_id when not provided (free plan)', () => {
    expect(ServiceOrdersAdapter.toCreatePayload({ planId: 'plan-1' })).toEqual({
      plan_id: 'plan-1'
    })
  })
})

describe('transformPlansList', () => {
  const v4Plan = {
    id: 'plan-uuid',
    name: 'Pro',
    slug: 'pro',
    sku: 'pro',
    description: 'For production',
    type: 'paid',
    status: 'active',
    active: true,
    sort_order: 10,
    last_editor: 'system@azion.com',
    last_modified: '2026-05-01T00:00:00Z',
    created_at: '2026-04-01T00:00:00Z',
    product_version: '1.0',
    pricings: [
      {
        id: 'price-uuid',
        currency_code: 'USD',
        price_value: 99,
        periodicity: 'monthly',
        active: true,
        valid_from: '2026-05-01T00:00:00Z'
      }
    ]
  }

  it('unwraps v4 envelope { results } and maps each plan', () => {
    const result = ServiceOrdersAdapter.transformPlansList({ results: [v4Plan] })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('plan-uuid')
    expect(result[0].pricings[0].id).toBe('price-uuid')
    expect(result[0].productVersion).toBe('1.0')
    expect(result[0].audit.lastEditor).toBe('system@azion.com')
  })

  it('accepts raw array (no envelope)', () => {
    const result = ServiceOrdersAdapter.transformPlansList([v4Plan])
    expect(result).toHaveLength(1)
  })

  it('returns empty array when input is invalid', () => {
    expect(ServiceOrdersAdapter.transformPlansList(null)).toEqual([])
    expect(ServiceOrdersAdapter.transformPlansList({})).toEqual([])
  })
})

describe('transformPlanDetailResponse', () => {
  it('unwraps { state, data } envelope for current plan', () => {
    const envelope = {
      state: 'executed',
      data: { id: 'plan-uuid', name: 'Pro', active: true, sort_order: 10, pricings: [] }
    }
    const result = ServiceOrdersAdapter.transformPlanDetailResponse(envelope)
    expect(result.state).toBe('executed')
    expect(result.data.id).toBe('plan-uuid')
    expect(result.data.name).toBe('Pro')
  })

  it('returns null data when envelope is empty (404 case)', () => {
    expect(ServiceOrdersAdapter.transformPlanDetailResponse({})).toEqual({
      state: null,
      data: null
    })
  })
})

describe('toPlanChangePayload', () => {
  it('accepts legacy { newPlanId, priceId } from older callers', () => {
    expect(
      ServiceOrdersAdapter.toPlanChangePayload({ newPlanId: 'plan-2', priceId: 'price-2' })
    ).toEqual({ plan_id: 'plan-2', plan_pricing_id: 'price-2' })
  })

  it('accepts new { planId, planPricingId } shape', () => {
    expect(
      ServiceOrdersAdapter.toPlanChangePayload({ planId: 'plan-2', planPricingId: 'price-2' })
    ).toEqual({ plan_id: 'plan-2', plan_pricing_id: 'price-2' })
  })

  it('omits plan_pricing_id when null/undefined (downgrade to free)', () => {
    expect(ServiceOrdersAdapter.toPlanChangePayload({ newPlanId: 'plan-free' })).toEqual({
      plan_id: 'plan-free'
    })
  })
})
