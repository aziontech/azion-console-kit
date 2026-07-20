import { describe, expect, it, beforeEach, vi } from 'vitest'
import { AccountCurrentService } from '@/services/v2/account/account-current-service'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'

vi.mock('@/services/v2/service-orders/service-orders-service', () => ({
  serviceOrdersService: {
    getCurrentServiceOrder: vi.fn(),
    getCurrentPlan: vi.fn()
  }
}))

const buildSoResponse = (data) => ({ state: 'executed', data })
const buildPlanResponse = (data) => ({ state: 'executed', data })

describe('AccountCurrentService.fetchCurrentServiceOrder', () => {
  let service

  beforeEach(() => {
    service = new AccountCurrentService()
    vi.mocked(serviceOrdersService.getCurrentServiceOrder).mockReset()
  })

  it('delegates to serviceOrdersService.getCurrentServiceOrder and returns { data }', async () => {
    const so = { serviceOrderId: 'so-uuid', status: 'ACTIVE' }
    vi.mocked(serviceOrdersService.getCurrentServiceOrder).mockResolvedValue(buildSoResponse(so))

    const result = await service.fetchCurrentServiceOrder()

    expect(serviceOrdersService.getCurrentServiceOrder).toHaveBeenCalledOnce()
    expect(result).toEqual({ data: so })
  })

  it('normalizes a 404 to { data: null }', async () => {
    vi.mocked(serviceOrdersService.getCurrentServiceOrder).mockRejectedValue({ statusCode: 404 })
    expect(await service.fetchCurrentServiceOrder()).toEqual({ data: null })
  })

  it('propagates non-404 errors', async () => {
    const err = { statusCode: 500 }
    vi.mocked(serviceOrdersService.getCurrentServiceOrder).mockRejectedValue(err)
    await expect(service.fetchCurrentServiceOrder()).rejects.toEqual(err)
  })

  it('returns { data: null } when underlying response has no data', async () => {
    vi.mocked(serviceOrdersService.getCurrentServiceOrder).mockResolvedValue({ state: 'executed' })
    expect(await service.fetchCurrentServiceOrder()).toEqual({ data: null })
  })
})

describe('AccountCurrentService.fetchCurrentPlan', () => {
  let service

  beforeEach(() => {
    service = new AccountCurrentService()
    vi.mocked(serviceOrdersService.getCurrentPlan).mockReset()
  })

  it('delegates to serviceOrdersService.getCurrentPlan and returns { data }', async () => {
    const plan = { id: 'plan-uuid', name: 'Pro' }
    vi.mocked(serviceOrdersService.getCurrentPlan).mockResolvedValue(buildPlanResponse(plan))

    const result = await service.fetchCurrentPlan()

    expect(serviceOrdersService.getCurrentPlan).toHaveBeenCalledOnce()
    expect(result).toEqual({ data: plan })
  })

  it('normalizes a 404 to { data: null } (e.g. DRAFT user not entitled yet)', async () => {
    vi.mocked(serviceOrdersService.getCurrentPlan).mockRejectedValue({
      response: { status: 404 }
    })
    expect(await service.fetchCurrentPlan()).toEqual({ data: null })
  })

  it('propagates non-404 errors', async () => {
    const err = new Error('boom')
    vi.mocked(serviceOrdersService.getCurrentPlan).mockRejectedValue(err)
    await expect(service.fetchCurrentPlan()).rejects.toThrow('boom')
  })
})
