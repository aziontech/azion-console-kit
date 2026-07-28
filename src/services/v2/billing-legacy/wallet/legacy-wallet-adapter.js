const extractEnvelopeData = (envelope = {}) => envelope?.data ?? null

const transformBillingPaymentMethod = (method = {}) => ({
  id: method.id ?? null,
  type: method.type ?? null,
  brand: method.brand ?? null,
  last4: method.last4 ?? null,
  expMonth: method.exp_month ?? null,
  expYear: method.exp_year ?? null,
  funding: method.funding ?? null,
  country: method.country ?? null,
  isDefault: Boolean(method.is_default)
})

const transformBillingAddress = (address) => {
  if (!address || typeof address !== 'object') return null
  return {
    line1: address.line1 ?? null,
    line2: address.line2 ?? null,
    city: address.city ?? null,
    state: address.state ?? null,
    postalCode: address.postal_code ?? null,
    country: address.country ?? null
  }
}

const transformBillingPaymentMethodsResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope) ?? {}
  const methods = Array.isArray(data.payment_methods)
    ? data.payment_methods.map(transformBillingPaymentMethod)
    : []
  return {
    state: envelope?.state ?? null,
    paymentMethods: methods,
    defaultPaymentMethod: methods.find((method) => method.isDefault) ?? null,
    billingAddress: transformBillingAddress(data.billing_address),
    customerEmail: data.customer_email ?? null,
    customerName: data.customer_name ?? null,
    stale: Boolean(data.stale)
  }
}

const transformSetupIntentResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope) ?? {}
  return {
    state: envelope?.state ?? null,
    clientSecret: data.client_secret ?? null
  }
}

const transformSetDefaultPaymentMethodResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope) ?? {}
  return {
    state: envelope?.state ?? null,
    paymentMethodId: data.payment_method_id ?? data.id ?? null
  }
}

export const LegacyWalletAdapter = {
  transformBillingPaymentMethod,
  transformBillingPaymentMethodsResponse,
  transformSetupIntentResponse,
  transformSetDefaultPaymentMethodResponse
}
