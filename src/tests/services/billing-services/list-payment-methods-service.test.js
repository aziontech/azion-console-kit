import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listPaymentMethodsService } from '@/services/billing-services'
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
  const sut = listPaymentMethodsService

  return {
    sut
  }
}

describe('BillingServices', () => {
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

  it('should parse correctly all returned payment methods', async () => {
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
          tagProps: {},
          text: '05/2030'
        },
        cardData: {
          cardBrand: 'visa',
          cardNumber: 'Ending in 4242',
          status: 'Default',
          value: 'visa 4242 Default'
        },
        isDefault: fixtures.paymentMockIsDefault.is_default,
        expiringDateByOrder: new Date('2030-05-01T00:00:00.000Z'),
        expiringDateSearch: '05/2030',
        cardNumberSearch: 'visa 4242 Default'
      },
      {
        id: fixtures.paymentMock.id,
        cardHolder: fixtures.paymentMock.card_holder,
        cardExpiration: {
          tagProps: { severity: 'warning', value: 'Expired' },
          text: '05/2019'
        },
        cardData: {
          cardBrand: 'visa',
          cardNumber: 'Ending in 4242',
          status: '',
          value: 'visa 4242 '
        },
        isDefault: fixtures.paymentMock.is_default,
        expiringDateByOrder: new Date('2019-05-01T00:00:00.000Z'),
        expiringDateSearch: '05/2019',
        cardNumberSearch: 'visa 4242 '
      }
    ])
  })
})
