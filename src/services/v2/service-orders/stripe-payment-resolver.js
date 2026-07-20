const SO_CLIENT_SECRET_KEYS = Object.freeze([
  'checkoutSessionClientSecret',
  'checkout_session_client_secret',
  'clientSecret',
  'client_secret'
])

const PAYMENT_RESPONSE_CLIENT_SECRET_KEYS = Object.freeze([
  'clientSecret',
  'client_secret',
  'checkoutSessionClientSecret',
  'checkout_session_client_secret'
])

const CHECKOUT_SESSION_ID_KEYS = Object.freeze(['checkoutSessionId', 'checkout_session_id'])

const firstDefinedKey = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return null
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key]
  }
  return null
}

const firstDefinedAcrossPaths = (paths, keys) => {
  for (const obj of paths) {
    const value = firstDefinedKey(obj, keys)
    if (value != null) return value
  }
  return null
}

const collectServiceOrderPaymentContainers = (data) => {
  const metadata = data?.metadata ?? null
  return [metadata, data, data?.payment, data?.session, data?.checkout, data?.stripe].filter(
    Boolean
  )
}

export const resolveServiceOrderPaymentMeta = (data) => {
  if (!data || typeof data !== 'object') {
    return { clientSecret: null, checkoutSessionId: null }
  }
  const containers = collectServiceOrderPaymentContainers(data)
  return {
    clientSecret: firstDefinedAcrossPaths(containers, SO_CLIENT_SECRET_KEYS) ?? null,
    checkoutSessionId: firstDefinedAcrossPaths(containers, CHECKOUT_SESSION_ID_KEYS) ?? null
  }
}

export const resolvePaymentFromResponse = (response) => {
  if (!response || typeof response !== 'object') return null
  const payment =
    response.payment ??
    response.data?.payment ??
    response.results?.payment ??
    response.session ??
    response.checkout ??
    null
  if (!payment) return null
  const clientSecret = firstDefinedKey(payment, PAYMENT_RESPONSE_CLIENT_SECRET_KEYS)
  return clientSecret ? { clientSecret } : null
}
