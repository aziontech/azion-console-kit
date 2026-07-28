import { describe, expect, it, beforeEach, vi } from 'vitest'
import { CreditsService } from '@/services/v2/billing-api/credits/credits-service'

const wireBalance = {
  account_id: 900,
  currency: 'USD',
  available_amount: 15000
}

const wireCreditEntry = {
  id: 501,
  created_at: null,
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: null,
  account_id: 900,
  amount: 10000,
  remaining_amount: 7500,
  type: 'incentive',
  source_ref: null,
  expires_at: null
}

describe('CreditsService', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new CreditsService()
    httpMock = vi.fn().mockResolvedValue({ data: { state: 'executed', data: wireBalance } })
    service.http = { request: httpMock }
  })

  it('gets the credit balance keeping amounts as integer cents', async () => {
    const result = await service.getCreditBalance()

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/billing/balance'
    })
    expect(result.state).toBe('executed')
    expect(result.data).toEqual({ accountId: 900, currency: 'USD', availableAmount: 15000 })
  })

  it('lists credits with snake_case pagination params', async () => {
    httpMock.mockResolvedValue({
      data: {
        count: 1,
        total_pages: 1,
        page: 2,
        page_size: 50,
        next: null,
        previous: null,
        results: [wireCreditEntry]
      }
    })

    const result = await service.listCredits({ page: 2, pageSize: 50 })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/billing/credits',
      params: { page: 2, page_size: 50 }
    })
    expect(result.count).toBe(1)
    expect(result.results).toHaveLength(1)
    expect(result.results[0].amount).toBe(10000)
    expect(result.results[0].remainingAmount).toBe(7500)
    expect(result.results[0].audit.createdAt).toBeNull()
  })

  it('lists credits with an empty params object', async () => {
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

    await service.listCredits()

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/billing/credits',
      params: {}
    })
  })
})
