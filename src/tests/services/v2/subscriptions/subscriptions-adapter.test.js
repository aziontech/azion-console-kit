import { describe, expect, it } from 'vitest'
import { SubscriptionsAdapter } from '@/services/v2/subscriptions/subscriptions-adapter'

const wireSubscription = {
  id: 101,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: 'user@azion.com',
  service_order_id: 55,
  current_version_id: 7,
  status: 'active',
  current_period_start: '2026-07-01T00:00:00Z',
  current_period_end: '2026-08-01T00:00:00Z',
  anniversary_day: 1,
  cancel_at_period_end: false
}

const wireListEnvelope = {
  count: 1,
  total_pages: 1,
  page: 1,
  page_size: 20,
  next: null,
  previous: null,
  results: [wireSubscription]
}

describe('SubscriptionsAdapter.transformSubscription', () => {
  it('maps snake_case wire fields to camelCase', () => {
    const result = SubscriptionsAdapter.transformSubscription(wireSubscription)

    expect(result).toEqual({
      id: 101,
      serviceOrderId: 55,
      currentVersionId: 7,
      status: 'active',
      currentPeriodStart: '2026-07-01T00:00:00Z',
      currentPeriodEnd: '2026-08-01T00:00:00Z',
      anniversaryDay: 1,
      cancelAtPeriodEnd: false,
      audit: {
        createdAt: '2026-07-01T00:00:00Z',
        lastModified: '2026-07-10T00:00:00Z',
        lastEditor: 'user@azion.com'
      }
    })
  })

  it('defaults nullable fields when absent', () => {
    const result = SubscriptionsAdapter.transformSubscription({
      id: 1,
      service_order_id: 2,
      status: 'incomplete',
      cancel_at_period_end: false
    })

    expect(result.currentVersionId).toBeNull()
    expect(result.currentPeriodStart).toBeNull()
    expect(result.currentPeriodEnd).toBeNull()
    expect(result.anniversaryDay).toBeNull()
    expect(result.audit.lastEditor).toBeNull()
  })
})

describe('SubscriptionsAdapter.transformListResponse', () => {
  it('maps the v4 paginated envelope', () => {
    const result = SubscriptionsAdapter.transformListResponse(wireListEnvelope)

    expect(result.count).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.next).toBeNull()
    expect(result.previous).toBeNull()
    expect(result.results).toHaveLength(1)
    expect(result.results[0].id).toBe(101)
  })

  it('returns an empty list for a malformed envelope', () => {
    const result = SubscriptionsAdapter.transformListResponse({})
    expect(result.results).toEqual([])
    expect(result.count).toBe(0)
  })
})

describe('SubscriptionsAdapter.transformDetailResponse', () => {
  it('unwraps the { state, data } envelope', () => {
    const result = SubscriptionsAdapter.transformDetailResponse({
      state: 'executed',
      data: wireSubscription
    })

    expect(result.state).toBe('executed')
    expect(result.data.id).toBe(101)
  })

  it('returns null data when the envelope is empty', () => {
    expect(SubscriptionsAdapter.transformDetailResponse({})).toEqual({
      state: null,
      data: null
    })
  })
})

describe('SubscriptionsAdapter.transformCreateResponse', () => {
  it('exposes subscription and payment client secret', () => {
    const result = SubscriptionsAdapter.transformCreateResponse({
      state: 'executed',
      data: {
        subscription: wireSubscription,
        payment: { client_secret: 'pi_secret_123', gateway: 'stripe' }
      }
    })

    expect(result.state).toBe('executed')
    expect(result.subscription.id).toBe(101)
    expect(result.payment).toEqual({ clientSecret: 'pi_secret_123', gateway: 'stripe' })
  })

  it('returns null payment when the API omits it', () => {
    const result = SubscriptionsAdapter.transformCreateResponse({
      state: 'executed',
      data: { subscription: wireSubscription, payment: null }
    })

    expect(result.payment).toBeNull()
  })
})

describe('SubscriptionsAdapter.transformChangePreviewResponse', () => {
  it('keeps amounts as integer cents', () => {
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

    expect(result.immediateTotal).toBe(2450)
    expect(result.lineItems).toEqual([{ description: 'Prorated charge', amount: 2450 }])
    expect(result.currency).toBe('USD')
    expect(result.prorationBehavior).toBe('create_prorations')
    expect(result.nextPeriodStart).toBe('2026-08-01T00:00:00Z')
  })
})

describe('SubscriptionsAdapter.transformSubscriptionVersion', () => {
  it('maps version snapshot fields including price table ref', () => {
    const result = SubscriptionsAdapter.transformSubscriptionVersion({
      id: 7,
      created_at: '2026-07-01T00:00:00Z',
      last_modified: '2026-07-01T00:00:00Z',
      last_editor: null,
      subscription_id: 101,
      service_order_id: 55,
      order_action_id: 3,
      plan_id: 12,
      period: 'annual',
      billing_mode: 'prepaid',
      recurring_fee_snapshot: 99900,
      price_table_ref: { id: 4, version: 2 },
      effective_from: '2026-07-01T00:00:00Z',
      effective_to: null,
      change_reason: 'upgrade'
    })

    expect(result.planId).toBe(12)
    expect(result.period).toBe('annual')
    expect(result.billingMode).toBe('prepaid')
    expect(result.recurringFeeSnapshot).toBe(99900)
    expect(result.priceTableRef).toEqual({ id: 4, version: 2 })
    expect(result.changeReason).toBe('upgrade')
  })
})

describe('SubscriptionsAdapter.transformScheduledChange', () => {
  it('maps a scheduled plan change', () => {
    const result = SubscriptionsAdapter.transformScheduledChange({
      id: 31,
      created_at: '2026-07-05T00:00:00Z',
      last_modified: '2026-07-05T00:00:00Z',
      last_editor: null,
      subscription_id: 101,
      type: 'change',
      effective_at: '2026-08-01T00:00:00Z',
      status: 'scheduled',
      change: { plan_id: 9, period: 'monthly' }
    })

    expect(result.type).toBe('change')
    expect(result.status).toBe('scheduled')
    expect(result.change).toEqual({ planId: 9, period: 'monthly' })
  })

  it('keeps change null for scheduled cancellations', () => {
    const result = SubscriptionsAdapter.transformScheduledChange({
      id: 32,
      subscription_id: 101,
      type: 'cancel',
      effective_at: '2026-08-01T00:00:00Z',
      status: 'scheduled',
      change: null
    })

    expect(result.change).toBeNull()
  })
})

describe('SubscriptionsAdapter payload builders', () => {
  it('builds a strict create payload without undefined fields', () => {
    expect(SubscriptionsAdapter.toCreatePayload({ planId: 12 })).toEqual({ plan_id: 12 })
  })

  it('builds a full create payload with tos acceptance', () => {
    expect(
      SubscriptionsAdapter.toCreatePayload({
        planId: 12,
        period: 'annual',
        accountId: 900,
        paymentMethodId: 44,
        tosAcceptance: { version: '2026-07' }
      })
    ).toEqual({
      plan_id: 12,
      period: 'annual',
      account_id: 900,
      payment_method_id: 44,
      tos_acceptance: { version: '2026-07' }
    })
  })

  it('builds a change payload with only provided fields', () => {
    expect(SubscriptionsAdapter.toChangePayload({ planId: 9, when: 'period_end' })).toEqual({
      plan_id: 9,
      when: 'period_end'
    })
  })

  it('builds a cancel payload', () => {
    expect(
      SubscriptionsAdapter.toCancelPayload({ when: 'period_end', reason: 'too expensive' })
    ).toEqual({ when: 'period_end', reason: 'too expensive' })
    expect(SubscriptionsAdapter.toCancelPayload()).toEqual({})
  })

  it('builds snake_case list params', () => {
    expect(
      SubscriptionsAdapter.toListParams({
        page: 2,
        pageSize: 50,
        billingAccount: 1,
        serviceOrder: 55,
        account: 900,
        product: 3,
        status: 'active'
      })
    ).toEqual({
      page: 2,
      page_size: 50,
      billing_account: 1,
      service_order: 55,
      account: 900,
      product: 3,
      status: 'active'
    })
  })
})
