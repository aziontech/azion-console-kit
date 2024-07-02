import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listPaymentService } from '@/services/billing-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  paymentMockIsDefault: {
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
  },
  paymentMock: {
    card_address_line1: '',
    card_address_line2: '',
    card_address_zip: '81000',
    card_brand: 'Visa',
    card_country: '',
    card_expiration_month: 5,
    card_expiration_year: 2019,
    card_holder: 'exp',
    card_id: 'card_1EXUDiFWyLwqlXZq2Jsjyg9d',
    card_last_4_digits: '4242',
    id: 32,
    is_default: false
  }
}

const makeSut = () => {
  const sut = listPaymentService

  return {
    sut
  }
}

describe('BillingService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/payments/credit_cards?page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned payment', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.paymentMockIsDefault, fixtures.paymentMock] }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        id: fixtures.paymentMock.id,
        cardHolder: fixtures.paymentMock.card_holder,
        cardExpiration: {
          expiringDate: '05/2030',
          status: ''
        },
        cardData: {
          cardBrand: 'Visa',
          cardNumber: '4242',
          status: 'Default'
        },
        isDefault: fixtures.paymentMockIsDefault.is_default
      },
      {
        id: fixtures.paymentMock.id,
        cardHolder: fixtures.paymentMock.card_holder,
        cardExpiration: {
          expiringDate: '05/2019',
          status: 'Expired'
        },
        cardData: {
          cardBrand: 'Visa',
          cardNumber: '4242',
          status: ''
        },
        isDefault: fixtures.paymentMock.is_default
      }
    ])
  })
})
