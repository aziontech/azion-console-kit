import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePaymentBaseUrl } from './make-payment-base-url'

export const listPaymentService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePaymentBaseUrl()}/credit_cards?page_size=200`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const formatDate = (month, year) => {
  const formatMonth = month < 10 ? `0${month}` : month

  return `${formatMonth}/${year}`
}

const getExpiredString = (month, year) => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const isExpiredByYear = year < currentYear
  const isExpiredByMonth = year === currentYear && month < currentMonth

  return isExpiredByYear || isExpiredByMonth ? 'Expired' : ''
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
    return {
      id: card.id,
      cardHolder: card.card_holder,
      cardExpiration: {
        expiringDate: formatDate(card.card_expiration_month, card.card_expiration_year),
        status: getExpiredString(card.card_expiration_month, card.card_expiration_year)
      },
      cardData: {
        cardNumber: card.card_last_4_digits,
        cardBrand: card.card_brand.toLowerCase(),
        status: card.is_default ? 'Default' : ''
      },
      isDefault: card.is_default
    }
  })

  return {
    body: parseBilling,
    statusCode: httpResponse.statusCode
  }
}
