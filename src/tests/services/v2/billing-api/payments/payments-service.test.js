import { describe, expect, it, beforeEach, vi } from 'vitest'
import { PaymentsService } from '@/services/v2/billing-api/payments/payments-service'
import { PAYMENT_STATUS } from '@/services/v2/billing-api/payments/payments-constants'

const wirePayment = {
  id: 501,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: null,
  invoice_id: 88,
  account_id: 900,
  amount: 2450,
  currency: 'USD',
  gateway: 'stripe',
  status: 'succeeded'
}

const detailEnvelope = { data: { state: 'executed', data: wirePayment } }

describe('PaymentsService', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new PaymentsService()
    httpMock = vi.fn().mockResolvedValue(detailEnvelope)
    service.http = { request: httpMock }
  })

  it('exposes the contract enum values', () => {
    expect(PAYMENT_STATUS.PENDING).toBe('pending')
    expect(PAYMENT_STATUS.PROCESSING).toBe('processing')
    expect(PAYMENT_STATUS.SUCCEEDED).toBe('succeeded')
    expect(PAYMENT_STATUS.FAILED).toBe('failed')
    expect(PAYMENT_STATUS.DISPUTED).toBe('disputed')
    expect(PAYMENT_STATUS.REFUNDED).toBe('refunded')
  })

  it('lists payments with snake_case filters', async () => {
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

    await service.listPayments({ pageSize: 50, invoice: 88, status: 'succeeded' })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/payments',
      params: { page_size: 50, invoice: 88, status: 'succeeded' }
    })
  })

  it('gets a payment by id and unwraps the detail envelope', async () => {
    const result = await service.getPayment(501)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/payments/501'
    })
    expect(result.state).toBe('executed')
    expect(result.data.id).toBe(501)
    expect(result.data.amount).toBe(2450)
  })
})
