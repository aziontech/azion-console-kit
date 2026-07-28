import { describe, expect, it } from 'vitest'
import { SubscriptionsAdapter } from '@/services/v2/billing-api/subscriptions/subscriptions-adapter'

describe('SubscriptionsAdapter.transformSubscription', () => {
  it('maps snake_case wire fields to camelCase, including the required service_order_id', () => {
    const result = SubscriptionsAdapter.transformSubscription({
      id: 101,
      service_order_id: 55,
      current_version_id: 7,
      status: 'active',
      current_period_start: '2026-07-01T00:00:00Z',
      current_period_end: '2026-08-01T00:00:00Z',
      anniversary_day: 1,
      cancel_at_period_end: false,
      created_at: '2026-07-01T00:00:00Z',
      last_modified: '2026-07-10T00:00:00Z',
      last_editor: 'user@azion.com'
    })

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
    expect(result.serviceOrderId).toBe(55)
  })

  it('defaults nullable fields when absent', () => {
    const result = SubscriptionsAdapter.transformSubscription({
      id: 1,
      status: 'incomplete',
      cancel_at_period_end: false
    })

    expect(result.currentVersionId).toBeNull()
    expect(result.currentPeriodStart).toBeNull()
    expect(result.anniversaryDay).toBeNull()
    expect(result.audit.lastEditor).toBeNull()
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

describe('SubscriptionsAdapter.transformChangeResponse (202)', () => {
  it('exposes the subscription, proration and pending_transition', () => {
    const result = SubscriptionsAdapter.transformChangeResponse({
      state: 'executed',
      data: {
        subscription: { id: 42, status: 'active', cancel_at_period_end: false },
        proration: { immediate_total: 1250 },
        pending_transition: { plan_id: 'plan-uuid', effective_at: '2026-08-01T00:00:00Z' }
      }
    })

    expect(result.state).toBe('executed')
    expect(result.subscription.id).toBe(42)
    expect(result.proration).toEqual({ immediate_total: 1250 })
    expect(result.pendingTransition).toEqual({
      plan_id: 'plan-uuid',
      effective_at: '2026-08-01T00:00:00Z'
    })
  })

  it('defaults subscription/proration/pendingTransition when absent', () => {
    const result = SubscriptionsAdapter.transformChangeResponse({ state: 'executed', data: {} })
    expect(result.subscription).toBeNull()
    expect(result.proration).toBeNull()
    expect(result.pendingTransition).toBeNull()
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
        planId: 'plan-uuid',
        period: 'annual',
        prorationBehavior: 'create_prorations',
        when: 'now'
      })
    ).toEqual({
      plan_id: 'plan-uuid',
      period: 'annual',
      proration_behavior: 'create_prorations',
      when: 'now'
    })
  })

  it('drops undefined and unknown fields (additionalProperties:false)', () => {
    expect(SubscriptionsAdapter.toChangePayload({ planId: 9, bogus: 'x' })).toEqual({ plan_id: 9 })
    expect(SubscriptionsAdapter.toChangePayload()).toEqual({})
  })
})
