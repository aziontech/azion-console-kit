const KNOWN_STRIPE_ERROR_MAP = {
  authentication_required: 'Authentication is required to complete this payment.',
  card_declined: 'Your card was declined. Please use a different payment method.',
  expired_card: 'Your card is expired. Please use a different card.',
  incorrect_cvc: 'The security code is incorrect. Please review your payment details.',
  processing_error: 'Payment processing failed. Please try again in a few moments.'
}

// Signatures Stripe emits when the client_secret refers to a session that no
// longer exists on their side (expired ~24h, already consumed, or wrong env).
const STALE_SESSION_SIGNATURES = [
  'no such checkout.session',
  'resource_missing',
  'checkout session has expired',
  'invalid checkout session'
]

export const mapStripeError = (rawMessage) => {
  const message = String(rawMessage || '')
  return (
    Object.entries(KNOWN_STRIPE_ERROR_MAP).find(([code]) => message.includes(code))?.[1] ||
    message ||
    'Unable to confirm payment. Please try again.'
  )
}

const extractErrorMessage = (error) => {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (typeof error.message === 'string') return error.message
  if (error.error?.message) return String(error.error.message)
  return ''
}

export const isStaleCheckoutSessionError = (error) => {
  const haystack = extractErrorMessage(error).toLowerCase()
  if (!haystack) return false
  return STALE_SESSION_SIGNATURES.some((needle) => haystack.includes(needle))
}
