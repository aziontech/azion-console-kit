import { describe, expect, it, beforeEach, vi } from 'vitest'
import { ServiceOrdersService } from '@/services/v2/billing-api/service-orders/service-orders-service'

const SO_ID = 77
const SUBSCRIPTION_ID = '019c9fa2-ee78-7a7a-a266-796f750d8261'

describe('ServiceOrdersService (green surface of spec §7)', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new ServiceOrdersService()
    httpMock = vi.fn().mockResolvedValue({ data: { state: 'executed', data: { id: SO_ID } } })
    service.http = { request: httpMock }
  })

  it('lists service orders with the contract query params', async () => {
    httpMock.mockResolvedValue({
      data: { count: 0, total_pages: 0, page: 1, page_size: 20, results: [] }
    })

    await service.listServiceOrders({
      pageSize: 50,
      status: 'active',
      billingAccount: 12,
      account: 900
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/service_orders',
      params: { page_size: 50, status: 'active', account: 900, billing_account: 12 }
    })
  })

  it('creates a service order with period and commercial_items, without idempotency header', async () => {
    await service.createServiceOrder({
      payload: {
        period: 'annual',
        commercialItems: [{ productId: 5, quantity: 2 }],
        billingMode: 'postpaid'
      }
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/service_orders',
      body: {
        period: 'annual',
        commercial_items: [{ product_id: 5, quantity: 2 }],
        billing_mode: 'postpaid'
      }
    })
    expect(httpMock.mock.calls[0][0].config).toBeUndefined()
  })

  it('lists the service orders of a subscription', async () => {
    httpMock.mockResolvedValue({ data: { results: [] } })

    await service.listSubscriptionServiceOrders({ subscriptionId: SUBSCRIPTION_ID })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: `/v4/account/subscriptions/${SUBSCRIPTION_ID}/service_orders`,
      params: {}
    })
  })

  it('gets a service order detail', async () => {
    const result = await service.getServiceOrder(SO_ID)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/service_orders/77'
    })
    expect(result.data.id).toBe(SO_ID)
  })

  it('patches only order_number — contractual terms change through actions', async () => {
    await service.updateServiceOrder({
      serviceOrderId: SO_ID,
      payload: { orderNumber: 'SO-2026-001', type: 'support', status: 'active' }
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'PATCH',
      url: '/v4/account/service_orders/77',
      body: { order_number: 'SO-2026-001' }
    })
  })

  it('lists order actions', async () => {
    httpMock.mockResolvedValue({ data: { results: [] } })

    await service.listServiceOrderActions(SO_ID)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/service_orders/77/actions'
    })
  })

  it('creates an order action with an idempotency key', async () => {
    await service.createServiceOrderAction({
      serviceOrderId: SO_ID,
      payload: { actionType: 'change', reason: 'commercial amendment' },
      idempotencyKey: 'action-key'
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/service_orders/77/actions',
      body: { action_type: 'change', reason: 'commercial amendment' },
      config: { headers: { 'idempotency-key': 'action-key' } }
    })
  })

  it('auto-generates the idempotency key on action when omitted', async () => {
    await service.createServiceOrderAction({
      serviceOrderId: SO_ID,
      payload: { actionType: 'renew' }
    })

    const sentKey = httpMock.mock.calls[0][0].config.headers['idempotency-key']
    expect(typeof sentKey).toBe('string')
    expect(sentKey.length).toBeGreaterThan(0)
  })

  it('gets the service order terms', async () => {
    httpMock.mockResolvedValue({ data: { state: 'executed', data: { id: 5, type: 'support' } } })

    await service.getServiceOrderTerms(SO_ID)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/service_orders/77/terms'
    })
  })

  it('cancels a service order carrying only the reason', async () => {
    await service.cancelServiceOrder({
      serviceOrderId: SO_ID,
      payload: { reason: 'customer request', when: 'now' }
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/service_orders/77/cancel',
      body: { reason: 'customer request' }
    })
  })
})
