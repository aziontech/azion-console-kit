import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePaymentBaseUrl } from './make-payment-base-url'
import { formatDateMonthAndYear } from '@/helpers/convert-date'
import { getExpiredDate } from '@/helpers/payment-method'

export const listPaymentService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePaymentBaseUrl()}/credit_cards?page_size=200`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const convertStringToDate = (dateString) => {
  const [month, year] = dateString.split('/')
  const dateValue = new Date(parseInt(year), parseInt(month) - 1)
  return dateValue
}

const adapt = (httpResponse) => {
  if (!httpResponse.body.results) {
    return {
      body: [],
      statusCode: httpResponse.statusCode
    }
  }

  const responseDataSorted = httpResponse.body.results.sort(
    (currentCard, nextCard) => nextCard.is_default - currentCard.is_default
  )

  const parseBilling = responseDataSorted.map((card) => {
    const cardDate = formatDateMonthAndYear(card.card_expiration_month, card.card_expiration_year)

    return {
      id: card.id,
      cardHolder: card.card_holder,
      cardExpiration: {
        expiringDate: cardDate,
        status: getExpiredDate(card.card_expiration_month, card.card_expiration_year)
      },
      cardData: {
        cardNumber: card.card_last_4_digits,
        cardBrand: card.card_brand.toLowerCase(),
        status: card.is_default ? 'Default' : ''
      },
      expiringDateByOrder: convertStringToDate(cardDate),
      expiringDateSearch: cardDate,
      cardNumberSearch: card.card_last_4_digits,
      isDefault: card.is_default
    }
  })

  return {
    body: parseBilling,
    statusCode: httpResponse.statusCode
  }
}
