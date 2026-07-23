// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { PaymentAdapter } from '@/services/v2/payment/payment-adapter'

const card = (overrides = {}) => ({
  id: 1,
  card_holder: 'ANA SILVA',
  card_brand: 'Visa',
  card_last_4_digits: '4242',
  card_expiration_month: 3,
  card_expiration_year: 2099,
  is_default: false,
  ...overrides
})

describe('PaymentAdapter.transformListCreditCards', () => {
  it('sorts the default card first regardless of input order', () => {
    const rows = PaymentAdapter.transformListCreditCards([
      card({ id: 1 }),
      card({ id: 2, is_default: true })
    ])

    expect(rows[0].id).toBe(2)
    expect(rows[0].isDefault).toBe(true)
  })

  it('formats expiration as MM/YYYY and flags an EXPIRED card with a warning tag', () => {
    const [expired] = PaymentAdapter.transformListCreditCards([
      card({ card_expiration_month: 1, card_expiration_year: 2020 })
    ])

    expect(expired.cardExpiration.text).toBe('01/2020')
    expect(expired.cardExpiration.tagProps).toEqual({ severity: 'warning', value: 'Expired' })
  })

  it('leaves a valid (future) card without the expired tag', () => {
    const [valid] = PaymentAdapter.transformListCreditCards([
      card({ card_expiration_month: 12, card_expiration_year: 2099 })
    ])

    expect(valid.cardExpiration.text).toBe('12/2099')
    expect(valid.cardExpiration.tagProps).toEqual({})
  })

  it('composes the searchable card value from brand, last digits and default status', () => {
    const [row] = PaymentAdapter.transformListCreditCards([card({ is_default: true })])

    expect(row.cardData.value).toBe('visa 4242 Default')
    expect(row.cardData.cardNumber).toBe('Ending in 4242')
    expect(row.cardNumberSearch).toBe('visa 4242 Default')
  })

  it('omits optional keys when the API omits the source fields', () => {
    const [row] = PaymentAdapter.transformListCreditCards([
      { is_default: false, card_brand: null, card_last_4_digits: null }
    ])

    expect(row).not.toHaveProperty('id')
    expect(row).not.toHaveProperty('cardHolder')
    expect(row).not.toHaveProperty('cardExpiration')
    expect(row).not.toHaveProperty('cardData')
  })

  it('returns an empty list for an empty input', () => {
    expect(PaymentAdapter.transformListCreditCards([])).toEqual([])
  })
})
