import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePaymentBaseUrl } from './make-payment-base-url'

export const loadPaymentMethodDefaultService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePaymentBaseUrl()}/credit_cards?is_default=True`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { body, statusCode } = httpResponse
  const results = body?.results || []

  const [responseCard] = results

  const parseBilling = responseCard
    ? {
        id: responseCard.id,
        cardData: {
          cardNumber: `Ending in ${responseCard.card_last_4_digits}`,
          cardNumberValue: responseCard.card_last_4_digits,
          cardBrand: responseCard.card_brand?.toLowerCase(),
          isDefault: responseCard.is_default
        }
      }
    : {}

  return {
    body: parseBilling,
    statusCode
  }
}
