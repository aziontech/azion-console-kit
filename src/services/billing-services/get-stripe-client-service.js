import { getEnvironment } from '@/helpers'
import { getRuntimeConfig } from '@/helpers/runtime-config'
import { loadStripe } from '@stripe/stripe-js/pure'

const LEGACY_STRIPE_ENV_VAR = {
  development: 'VITE_STRIPE_TOKEN_DEV',
  stage: 'VITE_STRIPE_TOKEN_STAGE',
  production: 'VITE_STRIPE_TOKEN_PROD'
}

const resolveStripeToken = (environment) => {
  return (
    getRuntimeConfig().stripeToken || import.meta.env[LEGACY_STRIPE_ENV_VAR[environment]]
  )
}

const makeStripeClient = async (environment) => {
  const isInvalidEnvironment = !['development', 'stage', 'production'].includes(environment)
  if (isInvalidEnvironment) {
    throw Error('Provide a valid environment to select correct tracking token')
  }

  const stripeToken = resolveStripeToken(environment)
  if (!stripeToken) {
    throw Error('Stripe token is missing, cannot load Stripe. View readme for more info.')
  }

  if (environment !== 'production') {
    /**
     * This avoids calling the endpoint m.stripe.com when not in production
     * For more information see: https://docs.stripe.com/disputes/prevention/advanced-fraud-detection#disabling-advanced-fraud-detection
     **/
    loadStripe.setLoadParameters({ advancedFraudSignals: false })
  }

  const stripeClient = await loadStripe(stripeToken, {
    locale: 'en'
  })

  return stripeClient
}

export const getStripeClientService = async () => {
  const environment = getEnvironment()
  try {
    return await makeStripeClient(environment)
  } catch (error) {
    throw new Error(error.message).message
  }
}
