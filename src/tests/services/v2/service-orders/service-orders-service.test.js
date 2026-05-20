import { describe, expect, it, vi } from 'vitest'
import { ServiceOrdersService } from '@/services/v2/service-orders/service-orders-service'

describe('ServiceOrdersService', () => {
  it('does not send accountId as a list query parameter', async () => {
    const service = new ServiceOrdersService()
    const request = vi.fn().mockResolvedValue({ data: { results: [], meta: {} } })
    service.http = { request }

    await service.listServiceOrders({
      accountId: 99999,
      limit: 10,
      offset: 20,
      status: 'ACTIVE',
      type: 'plan_subscription'
    })

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/edge_api/api/v1/service_orders',
      params: {
        limit: 10,
        offset: 20,
        status: 'ACTIVE',
        type: 'plan_subscription'
      }
    })
  })

  it('loads current account service order from the authenticated account endpoint', async () => {
    const service = new ServiceOrdersService()
    const request = vi.fn().mockResolvedValue({
      data: { service_order_id: 'so-1', plan_id: 'plan-1', status: 'ACTIVE' }
    })
    service.http = { request }

    const response = await service.getCurrentAccountServiceOrder()

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/edge_api/api/v1/account/service_order',
      processError: false
    })
    expect(response.data).toMatchObject({ serviceOrderId: 'so-1', planId: 'plan-1' })
  })

  it('loads current account plan from the authenticated account endpoint', async () => {
    const service = new ServiceOrdersService()
    const request = vi.fn().mockResolvedValue({
      data: { plan_id: 'plan-1', sku: 'pro', pricings: [] }
    })
    service.http = { request }

    const response = await service.getCurrentAccountPlan()

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/edge_api/api/v1/account/plan',
      processError: false
    })
    expect(response.data).toMatchObject({ id: 'plan-1', sku: 'pro' })
  })

  it('returns null data when current account endpoints return 404', async () => {
    const service = new ServiceOrdersService()
    service.http = {
      request: vi.fn().mockResolvedValue({ status: 404, data: { hasError: true } })
    }

    await expect(service.getCurrentAccountServiceOrder()).resolves.toMatchObject({ data: null })
    await expect(service.getCurrentAccountPlan()).resolves.toMatchObject({ data: null })
  })

  it('propagates current account endpoint errors that are not 404', async () => {
    const service = new ServiceOrdersService()
    const error = { status: 500 }
    service.http = {
      request: vi.fn().mockResolvedValue({
        status: 500,
        data: { hasError: true, error: () => error }
      })
    }

    await expect(service.getCurrentAccountServiceOrder()).rejects.toBe(error)
  })

  it('cancels pending downgrade through the lifecycle endpoint', async () => {
    const service = new ServiceOrdersService()
    const request = vi.fn().mockResolvedValue({
      data: {
        serviceOrder: { service_order_id: 'so-1', plan_id: 'plan-1', status: 'ACTIVE' },
        transition: { type: 'downgrade' }
      }
    })
    service.http = { request }
    service.queryClient = { invalidateQueries: vi.fn() }

    await service.cancelDowngradeServiceOrder('so-1')

    expect(request).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/edge_api/api/v1/service_orders/so-1/cancel_downgrade'
    })
    expect(service.queryClient.invalidateQueries).toHaveBeenCalled()
  })
})
