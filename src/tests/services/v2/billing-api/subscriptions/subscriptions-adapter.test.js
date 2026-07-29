import { describe, expect, it } from 'vitest'
import { SubscriptionsAdapter } from '@/services/v2/billing-api/subscriptions/subscriptions-adapter'

describe('SubscriptionsAdapter.transformSubscription', () => {
  it('maps the v1.0.0 wire fields, including plan_pricing_id and pending_transition', () => {
    const result = SubscriptionsAdapter.transformSubscription({
      id: '019c9fa2-aaaa-4bbb-8ccc-000000000001',
      type: 'plan_subscription',
      status: 'ACTIVE',
      plan_id: '019c9fa2-ee78-7a7a-a266-796f750d8261',
      plan_pricing_id: '019c9fa2-ee75-743c-8b0b-a1de319b9bfb',
      start_date: '2026-07-01T00:00:00Z',
      end_date: null,
      current_period_start: '2026-07-01T00:00:00Z',
      current_period_end: '2026-08-01T00:00:00Z',
      auto_renew: true,
      renew: 'monthly',
      product_version: '1.0',
      on_demand_enabled: false,
      pending_transition: {
        type: 'downgrade',
        to_plan_id: '019c9fa2-ee79-7ebf-b10a-c4dd48cbc067',
        to_plan_pricing_id: '019c9fa2-ee77-7667-aeee-0c58cc09041f',
        effective_date: '2026-08-01T00:00:00Z'
      },
      created_at: '2026-07-01T00:00:00Z',
      last_modified: '2026-07-10T00:00:00Z',
      last_editor: 'user@azion.com'
    })

    expect(result).toEqual({
      id: '019c9fa2-aaaa-4bbb-8ccc-000000000001',
      type: 'plan_subscription',
      status: 'ACTIVE',
      planId: '019c9fa2-ee78-7a7a-a266-796f750d8261',
      planPricingId: '019c9fa2-ee75-743c-8b0b-a1de319b9bfb',
      accountMode: null,
      billingMode: null,
      startDate: '2026-07-01T00:00:00Z',
      endDate: null,
      currentPeriodStart: '2026-07-01T00:00:00Z',
      currentPeriodEnd: '2026-08-01T00:00:00Z',
      autoRenew: true,
      renew: 'monthly',
      productVersion: '1.0',
      onDemandEnabled: false,
      pendingTransition: {
        type: 'downgrade',
        toPlanId: '019c9fa2-ee79-7ebf-b10a-c4dd48cbc067',
        toPlanPricingId: '019c9fa2-ee77-7667-aeee-0c58cc09041f',
        effectiveDate: '2026-08-01T00:00:00Z'
      },
      audit: {
        createdAt: '2026-07-01T00:00:00Z',
        lastModified: '2026-07-10T00:00:00Z',
        lastEditor: 'user@azion.com'
      }
    })
  })

  it('defaults nullable fields when absent', () => {
    const result = SubscriptionsAdapter.transformSubscription({
      id: 'sub-uuid',
      status: 'DRAFT',
      plan_id: 'plan-uuid'
    })

    expect(result.planPricingId).toBeNull()
    expect(result.currentPeriodStart).toBeNull()
    expect(result.pendingTransition).toBeNull()
    expect(result.renew).toBeNull()
    expect(result.audit.lastEditor).toBeNull()
  })

  it('maps account_mode and billing_mode when the payload carries them', () => {
    const result = SubscriptionsAdapter.transformSubscription({
      id: 'sub-uuid',
      status: 'ACTIVE',
      plan_id: 'plan-uuid',
      account_mode: 'custom',
      billing_mode: 'postpaid'
    })

    expect(result.accountMode).toBe('custom')
    expect(result.billingMode).toBe('postpaid')
  })
})

describe('SubscriptionsAdapter.transformScheduledChange (UUID string ids)', () => {
  it('maps a scheduled plan change', () => {
    const result = SubscriptionsAdapter.transformScheduledChange({
      id: 'sc-uuid',
      subscription_id: 'sub-uuid',
      type: 'change',
      effective_at: '2026-08-01T00:00:00Z',
      status: 'scheduled',
      change: { plan_id: 'plan-uuid', period: 'monthly' },
      created_at: '2026-07-05T00:00:00Z',
      last_modified: '2026-07-05T00:00:00Z',
      last_editor: null
    })

    expect(result.id).toBe('sc-uuid')
    expect(result.subscriptionId).toBe('sub-uuid')
    expect(result.type).toBe('change')
    expect(result.change).toEqual({ planId: 'plan-uuid', period: 'monthly' })
  })

  it('keeps change null for scheduled cancellations', () => {
    const result = SubscriptionsAdapter.transformScheduledChange({
      id: 'sc-2',
      subscription_id: 'sub-uuid',
      type: 'cancel',
      effective_at: '2026-08-01T00:00:00Z',
      status: 'scheduled',
      change: null
    })

    expect(result.change).toBeNull()
  })
})

describe('SubscriptionsAdapter change response (202)', () => {
  it('reads the 202 body as the subscription detail envelope', () => {
    const result = SubscriptionsAdapter.transformSubscriptionDetailResponse({
      state: 'executed',
      data: { id: 42, status: 'active', cancel_at_period_end: false }
    })

    expect(result.state).toBe('executed')
    expect(result.data.id).toBe(42)
    expect(result.data.status).toBe('active')
  })

  it('defaults the subscription to null when the envelope carries no data', () => {
    const result = SubscriptionsAdapter.transformSubscriptionDetailResponse({ state: 'executed' })
    expect(result.data).toBeNull()
  })
})

describe('SubscriptionsAdapter.transformChangePreviewResponse (200, pro-rata)', () => {
  it('keeps amounts as integer cents and reads the pro-rata fields', () => {
    const result = SubscriptionsAdapter.transformChangePreviewResponse({
      state: 'executed',
      data: {
        currency: 'USD',
        immediate_total: 2450,
        proration_behavior: 'create_prorations',
        line_items: [{ description: 'Prorated charge', amount: 2450 }],
        next_period_start: '2026-08-01T00:00:00Z',
        next_period_end: '2026-09-01T00:00:00Z'
      }
    })

    expect(result.currency).toBe('USD')
    expect(result.immediateTotal).toBe(2450)
    expect(result.prorationBehavior).toBe('create_prorations')
    expect(result.lineItems).toEqual([{ description: 'Prorated charge', amount: 2450 }])
    expect(result.nextPeriodStart).toBe('2026-08-01T00:00:00Z')
    expect(result.nextPeriodEnd).toBe('2026-09-01T00:00:00Z')
  })

  it('returns an empty line-item list when absent', () => {
    const result = SubscriptionsAdapter.transformChangePreviewResponse({ data: {} })
    expect(result.lineItems).toEqual([])
    expect(result.immediateTotal).toBeNull()
  })
})

describe('SubscriptionsAdapter scheduled_changes collection transforms', () => {
  it('maps a populated scheduled-changes list envelope', () => {
    const result = SubscriptionsAdapter.transformScheduledChangesListResponse({
      count: 1,
      total_pages: 1,
      page: 1,
      page_size: 20,
      next: null,
      previous: null,
      results: [
        {
          id: 'sc-1',
          subscription_id: 'sub-1',
          type: 'change',
          status: 'scheduled',
          change: { plan_id: 'plan-uuid', period: 'monthly' }
        }
      ]
    })

    expect(result.count).toBe(1)
    expect(result.results).toHaveLength(1)
    expect(result.results[0].type).toBe('change')
  })

  it('unwraps a scheduled-change detail envelope', () => {
    const result = SubscriptionsAdapter.transformScheduledChangeDetailResponse({
      state: 'executed',
      data: {
        id: 'sc-2',
        subscription_id: 'sub-1',
        type: 'cancel',
        status: 'scheduled',
        change: null
      }
    })

    expect(result.state).toBe('executed')
    expect(result.data.type).toBe('cancel')
    expect(result.data.change).toBeNull()
  })
})

describe('SubscriptionsAdapter.toChangePayload', () => {
  it('builds a full change payload with proration behavior and period', () => {
    expect(
      SubscriptionsAdapter.toChangePayload({
        planId: 9,
        period: 'annual',
        prorationBehavior: 'create_prorations'
      })
    ).toEqual({
      plan_id: 9,
      period: 'annual',
      proration_behavior: 'create_prorations'
    })
  })

  it('drops when and plan_pricing_id — neither exists in the change schema', () => {
    expect(
      SubscriptionsAdapter.toChangePayload({
        planId: 9,
        planPricingId: 'pricing-uuid',
        when: 'now'
      })
    ).toEqual({ plan_id: 9 })
  })

  it('drops undefined and unknown fields (additionalProperties:false)', () => {
    expect(SubscriptionsAdapter.toChangePayload({ planId: 9, bogus: 'x' })).toEqual({ plan_id: 9 })
    expect(SubscriptionsAdapter.toChangePayload()).toEqual({})
  })
})

describe('SubscriptionsAdapter.toCreatePayload', () => {
  it('carries only plan_id and plan_pricing_id — the pricing already encodes the period', () => {
    expect(
      SubscriptionsAdapter.toCreatePayload({
        planId: '019c9fa2-ee78-7a7a-a266-796f750d8261',
        planPricingId: '019c9fa2-ee75-743c-8b0b-a1de319b9bfb',
        period: 'annual'
      })
    ).toEqual({
      plan_id: '019c9fa2-ee78-7a7a-a266-796f750d8261',
      plan_pricing_id: '019c9fa2-ee75-743c-8b0b-a1de319b9bfb'
    })
  })

  it('drops fields that belong to create_service_order, not to create_subscription', () => {
    expect(
      SubscriptionsAdapter.toCreatePayload({
        planId: 'plan-uuid',
        accountId: 9999,
        paymentMethodId: 44,
        tosVersion: '2026-07-01',
        bogus: 'x'
      })
    ).toEqual({
      plan_id: 'plan-uuid'
    })
  })

  it('keeps the body minimal when only the plan is known', () => {
    expect(SubscriptionsAdapter.toCreatePayload({ planId: 'plan-uuid' })).toEqual({
      plan_id: 'plan-uuid'
    })
  })
})
