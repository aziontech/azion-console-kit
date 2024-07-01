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

const isExpired = (month, year) => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'Expired'
  } else {
    return ''
  }
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  const responseData = Array.isArray(httpResponse.body.results) ? httpResponse.body.results : []

  const responseDataSorted = responseData.sort((currentCard, nextCard) =>
    currentCard.is_default === nextCard.is_default ? 0 : currentCard.is_default ? -1 : 1
  )

  const parseBilling = responseDataSorted.map((card) => {
    return {
      id: card.id,
      cardHolder: card.card_holder,
      cardExpiration: {
        content: formatDate(card.card_expiration_month, card.card_expiration_year),
        cardBrand: '',
        tag: isExpired(card.card_expiration_month, card.card_expiration_year)
      },
      cardData: {
        content: card.card_last_4_digits,
        cardBrand: card.card_brand,
        tag: card.is_default ? 'Default' : ''
      }
    }
  })

  return {
    body: parseBilling,
    statusCode: httpResponse.statusCode
  }
}
