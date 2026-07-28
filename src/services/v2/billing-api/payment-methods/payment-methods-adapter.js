import { getExpiredDate, formatDateMonthAndYear } from '@/helpers'

const mapPaymentMethod = (item = {}) => ({
  id: item.id,
  accountId: item.account_id,
  type: item.type,
  gateway: item.gateway ?? null,
  paymentMethodRef: item.payment_method_ref ?? null,
  mandateRef: item.mandate_ref ?? null,
  brand: item.brand ?? null,
  last4: item.last4 ?? null,
  expMonth: item.exp_month ?? null,
  expYear: item.exp_year ?? null,
  isDefault: item.is_default,
  status: item.status,
  audit: {
    createdAt: item.created_at,
    lastModified: item.last_modified,
    lastEditor: item.last_editor ?? null
  }
})

const transformPaymentMethod = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? mapPaymentMethod(envelope.data) : null
})

const transformList = (response) => (Array.isArray(response) ? response.map(mapPaymentMethod) : [])

const transformSetupSession = (envelope = {}) => {
  const data = envelope?.data ?? {}
  return {
    state: envelope?.state ?? null,
    data: envelope?.data
      ? {
          setupSessionId: data.setup_session_id,
          clientSecret: data.client_secret,
          gateway: data.gateway
        }
      : null
  }
}

const toSetupSessionPayload = (payload = {}) => ({
  ...(payload.type !== undefined && { type: payload.type })
})

const toWalletRow = (method = {}) => {
  const cardDate =
    method.expMonth && method.expYear
      ? formatDateMonthAndYear(method.expMonth, method.expYear)
      : null
  const statusCard = method.isDefault ? 'Default' : ''
  const typeCard = method.brand?.toLowerCase()
  const dateExpired = cardDate && getExpiredDate(method.expMonth, method.expYear)
  const tagProps = dateExpired ? { severity: 'warning', value: dateExpired } : {}
  const [month, year] = cardDate?.split('/') || []
  const expiringDateByOrder = cardDate ? new Date(parseInt(year), parseInt(month) - 1) : null
  const cardNumberValue = `${typeCard || ''} ${method.last4 || ''} ${statusCard}`.trim()

  return {
    ...(method.id && { id: method.id }),
    ...(cardDate && {
      cardExpiration: { text: cardDate, tagProps },
      expiringDateByOrder,
      expiringDateSearch: cardDate
    }),
    ...(cardNumberValue && {
      cardData: {
        ...(method.last4 && { cardNumber: `Ending in ${method.last4}` }),
        ...(typeCard && { cardBrand: typeCard }),
        ...(statusCard && { status: statusCard }),
        value: cardNumberValue
      },
      cardNumberSearch: cardNumberValue
    }),
    ...(method.isDefault && { isDefault: method.isDefault })
  }
}

const toWalletRows = (methods) =>
  (Array.isArray(methods) ? [...methods] : [])
    .sort((current, next) => Number(Boolean(next.isDefault)) - Number(Boolean(current.isDefault)))
    .map(toWalletRow)

export const PaymentMethodsAdapter = {
  transformPaymentMethod,
  transformList,
  transformSetupSession,
  toSetupSessionPayload,
  toWalletRow,
  toWalletRows
}
