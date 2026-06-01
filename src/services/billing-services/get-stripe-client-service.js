import { getEnvironment } from '@/helpers'
import { loadStripe } from '@stripe/stripe-js/pure'

const makeStripeClient = async (environment) => {
  const stripeEnvVarName = {
    development: 'VITE_STRIPE_TOKEN_DEV',
    stage: 'VITE_STRIPE_TOKEN_STAGE',
    production: 'VITE_STRIPE_TOKEN_PROD'
  }

  const enviromentStripeToken = stripeEnvVarName[environment]

  const isInvalidEnvironment = !['development', 'stage', 'production'].includes(environment)
  if (isInvalidEnvironment) {
    throw Error('Provide a valid environment to select correct tracking token')
  }

  const stripeToken = import.meta.env[enviromentStripeToken]
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

/**
 * Fire-and-forget warmer meant to run on the screen *before* any payment form
 * (signup additional-data step, billing overview). `loadStripe` from
 * `@stripe/stripe-js/pure` injects and memoizes the js.stripe.com `<script>`
 * on first call, so kicking it off early moves the slow external download off
 * the checkout critical path — the later `getStripeClientService()` reuses the
 * cached download and resolves immediately. Errors are swallowed here; the
 * consuming payment component surfaces load failures when it actually mounts.
 */
export const warmStripeClient = () => {
  getStripeClientService().catch(() => {})
}
