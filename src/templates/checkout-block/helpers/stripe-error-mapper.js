const KNOWN_STRIPE_ERROR_MAP = {
  authentication_required: 'Authentication is required to complete this payment.',
  card_declined: 'Your card was declined. Please use a different payment method.',
  expired_card: 'Your card is expired. Please use a different card.',
  incorrect_cvc: 'The security code is incorrect. Please review your payment details.',
  processing_error: 'Payment processing failed. Please try again in a few moments.'
}

export const mapStripeError = (rawMessage) => {
  const message = String(rawMessage || '')
  return (
    Object.entries(KNOWN_STRIPE_ERROR_MAP).find(([code]) => message.includes(code))?.[1] ||
    message ||
    'Unable to confirm payment. Please try again.'
  )
}
