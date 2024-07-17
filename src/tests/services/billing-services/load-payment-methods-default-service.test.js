import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadPaymentMethodDefaultService } from '@/services/billing-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  paymentIsDefault: {
    card_address_line1: '',
    card_address_line2: '',
    card_address_zip: '81000',
    card_brand: 'Visa',
    card_country: '',
    card_expiration_month: 5,
    card_expiration_year: 2030,
    card_holder: 'exp',
    card_id: 'card_1EXUDiFWyLwqlXZq2Jsjyg9d',
    card_last_4_digits: '4242',
    id: 32,
    is_default: true
  }
}

const makeSut = () => {
  const sut = loadPaymentMethodDefaultService

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/payments/credit_cards?is_default=True`,
      method: 'GET'
    })
  })

  it('should parse correctly returned payment methods default', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.paymentIsDefault] }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual({
      id: fixtures.paymentIsDefault.id,
      cardData: {
        cardBrand: 'visa',
        cardNumber: 'Ending in 4242',
        cardNumberValue: fixtures.paymentIsDefault.card_last_4_digits,
        isDefault: fixtures.paymentIsDefault.is_default
      }
    })
  })
})
