// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest'
import { PaymentService } from '@/services/v2/payment/payment-service'
import { spyHttpRequest } from '../../../support/versioning/boundaries'

/**
 * Payment service (test-maturity fase 2 — money area, previously 0% covered).
 * Every public method proven at the HTTP boundary with real adapter output.
 */
afterEach(() => {
  vi.restoreAllMocks()
})

const service = () => new PaymentService()

describe('credit cards', () => {
  it('listCreditCards GETs v4/payments/credit_cards and returns adapted rows', async () => {
    const http = spyHttpRequest()
    http.respondWith({
      count: 1,
      results: [
        {
          id: 9,
          card_holder: 'ANA SILVA',
          card_brand: 'Visa',
          card_last_4_digits: '4242',
          card_expiration_month: 3,
          card_expiration_year: 2099,
          is_default: true
        }
      ]
    })

    const result = await service().listCreditCards({ pageSize: 5 })

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'GET',
      url: 'v4/payments/credit_cards',
      params: { pageSize: 5 }
    })
    expect(result.count).toBe(1)
    expect(result.body[0]).toMatchObject({
      id: 9,
      cardHolder: 'ANA SILVA',
      isDefault: true,
      cardData: { cardBrand: 'visa', cardNumber: 'Ending in 4242', status: 'Default' }
    })
  })

  it('createCreditCard POSTs the payload and returns the feedback', async () => {
    const http = spyHttpRequest()
    http.respondWith({})

    const result = await service().createCreditCard({ card_token: 'tok_1' })

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'POST',
      url: 'v4/payments/credit_cards',
      body: { card_token: 'tok_1' }
    })
    expect(result).toEqual({ feedback: 'Your Payment Method has been added' })
  })

  it('getCreditCard GETs by id and unwraps data.data', async () => {
    const http = spyHttpRequest()
    http.respondWith({ data: { id: 9, card_last_4_digits: '4242' } })

    const card = await service().getCreditCard(9)

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'GET',
      url: 'v4/payments/credit_cards/9'
    })
    expect(card).toEqual({ id: 9, card_last_4_digits: '4242' })
  })

  it('editCreditCard PATCHes by id and unwraps data.data', async () => {
    const http = spyHttpRequest()
    http.respondWith({ data: { id: 9, is_default: true } })

    const card = await service().editCreditCard(9, { is_default: true })

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'PATCH',
      url: 'v4/payments/credit_cards/9',
      body: { is_default: true }
    })
    expect(card).toEqual({ id: 9, is_default: true })
  })

  it('deleteCreditCard DELETEs by id and returns the feedback', async () => {
    const http = spyHttpRequest()
    http.respondWith({})

    const feedback = await service().deleteCreditCard(9)

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'DELETE',
      url: 'v4/payments/credit_cards/9'
    })
    expect(feedback).toBe('Payment Method successfully deleted!')
  })
})

describe('credits and history', () => {
  it('addCredit POSTs the amount to v4/payments/credits', async () => {
    const http = spyHttpRequest()
    http.respondWith({})

    const result = await service().addCredit({ amount: 250 })

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'POST',
      url: 'v4/payments/credits',
      body: { amount: 250 }
    })
    expect(result).toEqual({ feedback: 'Credit added successfully.' })
  })

  it('listPaymentsHistory GETs v4/payments/history and returns the raw results', async () => {
    const http = spyHttpRequest()
    http.respondWith({ results: [{ invoice: 'INV-1' }] })

    const rows = await service().listPaymentsHistory()

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'GET',
      url: 'v4/payments/history',
      params: { pageSize: 100 }
    })
    expect(rows).toEqual([{ invoice: 'INV-1' }])
  })
})

describe('error paths — HTTP failure must never look like success', () => {
  it.each([
    { method: 'listCreditCards', call: (sut) => sut.listCreditCards() },
    { method: 'createCreditCard', call: (sut) => sut.createCreditCard({ cardNumber: '4242' }) },
    { method: 'editCreditCard', call: (sut) => sut.editCreditCard(9, { isDefault: true }) },
    { method: 'deleteCreditCard', call: (sut) => sut.deleteCreditCard(9) },
    { method: 'addCredit', call: (sut) => sut.addCredit({ amount: 10 }) },
    { method: 'listPaymentsHistory', call: (sut) => sut.listPaymentsHistory() }
  ])('$method propagates the boundary rejection', async ({ call }) => {
    const http = spyHttpRequest()
    http.rejectNext(new Error('payment API down'))

    await expect(call(service())).rejects.toThrow('payment API down')
  })
})
