import { describe, expect, it, beforeEach, vi } from 'vitest'
import { SubscriptionsService } from '@/services/v2/subscriptions/subscriptions-service'

const wireSubscription = {
  id: 101,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: null,
  service_order_id: 55,
  status: 'active',
  cancel_at_period_end: false
}

const detailEnvelope = { data: { state: 'executed', data: wireSubscription } }

describe('SubscriptionsService', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new SubscriptionsService()
    httpMock = vi.fn().mockResolvedValue(detailEnvelope)
    service.http = { request: httpMock }
  })

  it('lists subscriptions with snake_case filters', async () => {
    httpMock.mockResolvedValue({
      data: {
        count: 0,
        total_pages: 0,
        page: 1,
        page_size: 20,
        next: null,
        previous: null,
        results: []
      }
    })

    await service.listSubscriptions({ pageSize: 50, status: 'active' })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/subscriptions',
      params: { page_size: 50, status: 'active' }
    })
  })

  it('gets a subscription by id', async () => {
    const result = await service.getSubscription(101)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/subscriptions/101'
    })
    expect(result.data.id).toBe(101)
  })

  it('gets the current subscription', async () => {
    await service.getCurrentSubscription()

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/subscriptions/current'
    })
  })

  it('creates a subscription with an idempotency key header', async () => {
    httpMock.mockResolvedValue({
      data: {
        state: 'executed',
        data: {
          subscription: wireSubscription,
          payment: { client_secret: 'pi_secret', gateway: 'stripe' }
        }
      }
    })

    const result = await service.createSubscription({
      planId: 12,
      tosAcceptance: { version: '2026-07' }
    })

    const request = httpMock.mock.calls[0][0]
    expect(request.method).toBe('POST')
    expect(request.url).toBe('/v4/account/subscriptions')
    expect(request.body).toEqual({ plan_id: 12, tos_acceptance: { version: '2026-07' } })
    expect(request.config.headers['idempotency-key']).toEqual(expect.any(String))
    expect(request.config.headers['idempotency-key'].length).toBeGreaterThan(0)
    expect(result.payment.clientSecret).toBe('pi_secret')
  })

  it('reuses a caller-provided idempotency key on create', async () => {
    httpMock.mockResolvedValue({
      data: { state: 'executed', data: { subscription: wireSubscription, payment: null } }
    })

    await service.createSubscription({ planId: 12 }, { idempotencyKey: 'fixed-key' })

    expect(httpMock.mock.calls[0][0].config.headers['idempotency-key']).toBe('fixed-key')
  })

  it('changes a subscription plan with an idempotency key header', async () => {
    await service.changeSubscription({
      id: 101,
      payload: { planId: 9, when: 'period_end' },
      idempotencyKey: 'change-key'
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/subscriptions/101/change',
      body: { plan_id: 9, when: 'period_end' },
      config: { headers: { 'idempotency-key': 'change-key' } }
    })
  })

  it('previews a change without idempotency header', async () => {
    httpMock.mockResolvedValue({
      data: {
        state: 'executed',
        data: {
          currency: 'USD',
          immediate_total: 2450,
          proration_behavior: 'create_prorations',
          line_items: []
        }
      }
    })

    const result = await service.previewSubscriptionChange({
      id: 101,
      payload: { planId: 9 }
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/subscriptions/101/change/preview',
      body: { plan_id: 9 }
    })
    expect(result.immediateTotal).toBe(2450)
  })

  it('cancels a subscription with an explicit body', async () => {
    await service.cancelSubscription({ id: 101, payload: { when: 'period_end' } })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/subscriptions/101/cancel',
      body: { when: 'period_end' }
    })
  })

  it('sends an empty object body when cancelling without options', async () => {
    await service.cancelSubscription({ id: 101 })

    expect(httpMock.mock.calls[0][0].body).toEqual({})
  })

  it('lists versions and scheduled changes under the subscription path', async () => {
    httpMock.mockResolvedValue({
      data: {
        count: 0,
        total_pages: 0,
        page: 1,
        page_size: 20,
        next: null,
        previous: null,
        results: []
      }
    })

    await service.listSubscriptionVersions(101)
    await service.listScheduledChanges(101)

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/v4/account/subscriptions/101/versions'
    })
    expect(httpMock).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      url: '/v4/account/subscriptions/101/scheduled_changes'
    })
  })

  it('deletes a scheduled change and echoes its id', async () => {
    httpMock.mockResolvedValue({ status: 204 })

    const result = await service.deleteScheduledChange({ id: 101, scheduledChangeId: 31 })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/v4/account/subscriptions/101/scheduled_changes/31'
    })
    expect(result).toEqual({ id: 31 })
  })
})
