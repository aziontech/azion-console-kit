import { describe, expect, it, beforeEach, vi } from 'vitest'
import { SubscriptionsService } from '@/services/v2/billing-api/subscriptions/subscriptions-service'

const SUBSCRIPTION_ID = 42

describe('SubscriptionsService (READY surface: change + scheduled_changes)', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new SubscriptionsService()
    httpMock = vi.fn().mockResolvedValue({ data: { state: 'executed', data: {} } })
    service.http = { request: httpMock }
  })

  it('applies a plan change on the subscription id with an idempotency key', async () => {
    httpMock.mockResolvedValue({
      data: {
        state: 'executed',
        data: { id: 42, status: 'active', cancel_at_period_end: false }
      }
    })

    const result = await service.changeSubscription({
      subscriptionId: SUBSCRIPTION_ID,
      payload: { planId: 9, period: 'annual', prorationBehavior: 'create_prorations' },
      idempotencyKey: 'change-key'
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/subscriptions/42/change',
      body: { plan_id: 9, period: 'annual', proration_behavior: 'create_prorations' },
      config: { headers: { 'idempotency-key': 'change-key' } }
    })
    expect(result.state).toBe('executed')
    expect(result.data.id).toBe(42)
  })

  it('auto-generates an idempotency key on change when the caller omits one', async () => {
    await service.changeSubscription({ subscriptionId: SUBSCRIPTION_ID, payload: { planId: 9 } })

    const header = httpMock.mock.calls[0][0].config.headers['idempotency-key']
    expect(header).toEqual(expect.any(String))
    expect(header.length).toBeGreaterThan(0)
  })

  it('previews a change with NO idempotency header and reads the pro-rata shape', async () => {
    httpMock.mockResolvedValue({
      data: {
        state: 'executed',
        data: {
          currency: 'USD',
          immediate_total: 2450,
          proration_behavior: 'create_prorations',
          line_items: [{ description: 'Prorated charge', amount: 2450 }],
          next_period_start: '2026-08-01T00:00:00Z',
          next_period_end: '2026-09-01T00:00:00Z'
        }
      }
    })

    const result = await service.previewSubscriptionChange({
      subscriptionId: SUBSCRIPTION_ID,
      payload: { planId: 9, period: 'monthly' }
    })

    const request = httpMock.mock.calls[0][0]
    expect(request.method).toBe('POST')
    expect(request.url).toBe('/v4/account/subscriptions/42/change/preview')
    expect(request.body).toEqual({ plan_id: 9, period: 'monthly' })
    expect(request.config).toBeUndefined()
    expect(result.prorationBehavior).toBe('create_prorations')
    expect(result.immediateTotal).toBe(2450)
    expect(result.nextPeriodStart).toBe('2026-08-01T00:00:00Z')
  })

  it('lists scheduled changes under the subscription path', async () => {
    httpMock.mockResolvedValue({
      data: {
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
            change: null
          }
        ]
      }
    })

    const result = await service.listScheduledChanges(SUBSCRIPTION_ID)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/subscriptions/42/scheduled_changes'
    })
    expect(result.results).toHaveLength(1)
    expect(result.results[0].id).toBe('sc-1')
  })

  it('gets a single scheduled change by id', async () => {
    httpMock.mockResolvedValue({
      data: {
        state: 'executed',
        data: {
          id: 'sc-1',
          subscription_id: 'sub-1',
          type: 'change',
          status: 'scheduled',
          change: { plan_id: 'plan-uuid', period: 'monthly' }
        }
      }
    })

    const result = await service.getScheduledChange({
      subscriptionId: SUBSCRIPTION_ID,
      scheduledChangeId: 'sc-1'
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/subscriptions/42/scheduled_changes/sc-1'
    })
    expect(result.data.change).toEqual({ planId: 'plan-uuid', period: 'monthly' })
  })

  it('deletes a scheduled change and echoes its id (204, no body)', async () => {
    httpMock.mockResolvedValue({ status: 204 })

    const result = await service.deleteScheduledChange({
      subscriptionId: SUBSCRIPTION_ID,
      scheduledChangeId: 'sc-1'
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/v4/account/subscriptions/42/scheduled_changes/sc-1'
    })
    expect(result).toEqual({ id: 'sc-1' })
  })
})
