import { getEnvironment } from '@/helpers'
import { loadStripe } from '@stripe/stripe-js/pure'

const stripeEnvVarName = {
  development: 'VITE_STRIPE_TOKEN_DEV',
  stage: 'VITE_STRIPE_TOKEN_STAGE',
  production: 'VITE_STRIPE_TOKEN_PROD'
}

let stripeClientPromise = null
let stripeClientCacheKey = ''

const resolveStripeToken = (environment) => {
  const isInvalidEnvironment = !['development', 'stage', 'production'].includes(environment)
  if (isInvalidEnvironment) {
    throw Error('Provide a valid environment to select correct tracking token')
  }

  const environmentStripeToken = stripeEnvVarName[environment]
  const stripeToken = import.meta.env[environmentStripeToken]
  if (!stripeToken) {
    throw Error('Stripe token is missing, cannot load Stripe. View readme for more info.')
  }

  return stripeToken
}

const makeStripeClient = async ({ environment, stripeToken }) => {
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
  const stripeToken = resolveStripeToken(environment)
  const cacheKey = `${environment}:${stripeToken}`

  if (!stripeClientPromise || stripeClientCacheKey !== cacheKey) {
    stripeClientCacheKey = cacheKey
    stripeClientPromise = makeStripeClient({ environment, stripeToken }).catch((error) => {
      if (stripeClientCacheKey === cacheKey) {
        stripeClientPromise = null
        stripeClientCacheKey = ''
      }
      throw error
    })
  }

  return stripeClientPromise
}

/**
 * Fire-and-forget warmer meant to run on the screen *before* any payment form
 * (signup additional-data step, billing overview). `loadStripe` from
 * `@stripe/stripe-js/pure` injects and memoizes the js.stripe.com `<script>`
 * on first call, so kicking it off early moves the slow external download off
 * the checkout critical path — the later `getStripeClientService()` reuses the
 * cached client promise and resolves immediately. Errors are swallowed here;
 * the consuming payment component surfaces load failures when it actually
 * mounts.
 */
export const warmStripeClient = () => {
  getStripeClientService().catch(() => {})
}
