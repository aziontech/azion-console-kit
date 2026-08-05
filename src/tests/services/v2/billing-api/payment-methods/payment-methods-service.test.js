import { describe, expect, it, beforeEach, vi } from 'vitest'
import { PaymentMethodsService } from '@/services/v2/billing-api/payment-methods/payment-methods-service'

const wirePaymentMethod = {
  id: 501,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: null,
  account_id: 900,
  type: 'card',
  gateway: 'stripe',
  payment_method_ref: 'pm_123',
  mandate_ref: null,
  brand: 'visa',
  last4: '4242',
  exp_month: 12,
  exp_year: 2030,
  is_default: true,
  status: 'active'
}

const detailEnvelope = { data: { state: 'executed', data: wirePaymentMethod } }

describe('PaymentMethodsService', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new PaymentMethodsService()
    httpMock = vi.fn().mockResolvedValue(detailEnvelope)
    service.http = { request: httpMock }
  })

  it('lists payment methods from a bare array', async () => {
    httpMock.mockResolvedValue({ data: [wirePaymentMethod] })

    const result = await service.listPaymentMethods()

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/payments/payment_methods'
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(501)
    expect(result[0].isDefault).toBe(true)
    expect(result[0].last4).toBe('4242')
  })

  it('returns an empty list when the API omits the array', async () => {
    httpMock.mockResolvedValue({ data: undefined })

    const result = await service.listPaymentMethods()

    expect(result).toEqual([])
  })

  it('surfaces the X-Stale header alongside the list, for the degraded-gateway state', async () => {
    httpMock.mockResolvedValue({
      data: [wirePaymentMethod],
      headers: { 'x-stale': 'true' }
    })

    const result = await service.listPaymentMethodsWithMeta()

    expect(result.paymentMethods).toHaveLength(1)
    expect(result.isStale).toBe(true)
  })

  it('reads X-Stale from an axios headers object and defaults to fresh', async () => {
    httpMock.mockResolvedValue({
      data: [wirePaymentMethod],
      headers: { get: (name) => (name === 'x-stale' ? 'TRUE' : null) }
    })
    expect((await service.listPaymentMethodsWithMeta()).isStale).toBe(true)

    httpMock.mockResolvedValue({ data: [wirePaymentMethod] })
    expect((await service.listPaymentMethodsWithMeta()).isStale).toBe(false)
  })

  it('creates a setup session without an idempotency header', async () => {
    httpMock.mockResolvedValue({
      data: {
        state: 'executed',
        data: { setup_session_id: 'seti_1', client_secret: 'seti_secret_123', gateway: 'stripe' }
      }
    })

    const result = await service.createSetupSession({ type: 'card' })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/payments/payment_setup_sessions',
      body: { type: 'card' }
    })
    const request = httpMock.mock.calls[0][0]
    expect(request.config).toBeUndefined()
    expect(result.data.clientSecret).toBe('seti_secret_123')
    expect(result.data.setupSessionId).toBe('seti_1')
  })

  it('creates a setup session with an empty body when the type is omitted', async () => {
    httpMock.mockResolvedValue({
      data: {
        state: 'executed',
        data: { setup_session_id: 'seti_2', client_secret: 'seti_secret_456', gateway: 'stripe' }
      }
    })

    await service.createSetupSession()

    expect(httpMock.mock.calls[0][0].body).toEqual({})
    expect(httpMock.mock.calls[0][0].config).toBeUndefined()
  })

  it('gets a payment method by id', async () => {
    const result = await service.getPaymentMethod(501)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/account/payments/payment_methods/501'
    })
    expect(result.state).toBe('executed')
    expect(result.data.id).toBe(501)
    expect(result.data.mandateRef).toBeNull()
  })

  it('deletes a payment method and echoes its id', async () => {
    httpMock.mockResolvedValue({ status: 204 })

    const result = await service.deletePaymentMethod(501)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/v4/account/payments/payment_methods/501'
    })
    expect(result).toEqual({ id: 501 })
  })

  it('sets a payment method as default with no body and no idempotency header', async () => {
    const result = await service.setDefaultPaymentMethod(501)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/account/payments/payment_methods/501/default'
    })
    const request = httpMock.mock.calls[0][0]
    expect(request.body).toBeUndefined()
    expect(request.config).toBeUndefined()
    expect(result.state).toBe('executed')
    expect(result.data.id).toBe(501)
    expect(result.data.isDefault).toBe(true)
  })
})
