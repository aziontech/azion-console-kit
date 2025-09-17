import { getExpiredDate, formatDateMonthAndYear } from '@/helpers'

export const PaymentAdapter = {
  transformListCreditCards(data) {
    return data
      .sort((currentCard, nextCard) => nextCard.is_default - currentCard.is_default)
      .map((card) => {
        const cardDate =
          card.card_expiration_month && card.card_expiration_year
            ? formatDateMonthAndYear(card.card_expiration_month, card.card_expiration_year)
            : null

        const statusCard = card?.is_default ? 'Default' : ''
        const typeCard = card.card_brand?.toLowerCase()
        const dateExpired =
          cardDate && getExpiredDate(card.card_expiration_month, card.card_expiration_year)
        const tagProps = dateExpired ? { severity: 'warning', value: dateExpired } : {}
        const [month, year] = cardDate?.split('/') || []
        const expiringDateByOrder = cardDate ? new Date(parseInt(year), parseInt(month) - 1) : null
        const cardNumberValue = `${typeCard || ''} ${
          card.card_last_4_digits || ''
        } ${statusCard}`.trim()

        return {
          ...(card.id && { id: card.id }),
          ...(card.card_holder && { cardHolder: card.card_holder }),
          ...(cardDate && {
            cardExpiration: {
              text: cardDate,
              tagProps
            },
            expiringDateByOrder,
            expiringDateSearch: cardDate
          }),
          ...(cardNumberValue && {
            cardData: {
              ...(card.card_last_4_digits && {
                cardNumber: `Ending in ${card.card_last_4_digits}`
              }),
              ...(typeCard && { cardBrand: typeCard }),
              ...(statusCard && { status: statusCard }),
              value: cardNumberValue
            },
            cardNumberSearch: cardNumberValue
          }),
          ...(card.is_default && { isDefault: card.is_default })
        }
      })
  }
}
