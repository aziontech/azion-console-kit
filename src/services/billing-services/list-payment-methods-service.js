import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePaymentBaseUrl } from './make-payment-base-url'
import { formatDateMonthAndYear } from '@/helpers/convert-date'
import { getExpiredDate } from '@/helpers/payment-method'

export const listPaymentMethodsService = async () => {
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

const getTagProps = (card) => {
  const dateExpired = getExpiredDate(card.card_expiration_month, card.card_expiration_year)
  return dateExpired ? { severity: 'warning', value: dateExpired } : {}
}

const adapt = (httpResponse) => {
  const { body, statusCode } = httpResponse
  if (!body.results || !body.results.length) {
    return {
      body: [],
      statusCode: statusCode
    }
  }

  const responseDataSorted = body.results.sort(
    (currentCard, nextCard) => nextCard.is_default - currentCard.is_default
  )

  const parseBilling = responseDataSorted.map((card) => {
    const cardDate = formatDateMonthAndYear(card.card_expiration_month, card.card_expiration_year)
    const statusCard = card.is_default ? 'Default' : ''
    const typeCard = card.card_brand?.toLowerCase()
    const tagProps = getTagProps(card)

    return {
      id: card.id,
      cardHolder: card.card_holder,
      cardExpiration: {
        text: cardDate,
        tagProps
      },
      cardData: {
        cardNumber: `Ending in ${card.card_last_4_digits}`,
        cardBrand: typeCard,
        status: statusCard,
        value: `${typeCard} ${card.card_last_4_digits} ${statusCard}`
      },
      expiringDateByOrder: convertStringToDate(cardDate),
      expiringDateSearch: cardDate,
      cardNumberSearch: `${typeCard} ${card.card_last_4_digits} ${statusCard}`,
      isDefault: card.is_default
    }
  })

  return {
    body: parseBilling,
    statusCode: statusCode
  }
}
