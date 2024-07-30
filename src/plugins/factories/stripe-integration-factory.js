import { loadStripe } from '@stripe/stripe-js'

export function makeStripeClient(environment) {
  const stripeEnvVarName = {
    development: 'VITE_DEV_STRIPE_TOKEN',
    stage: 'VITE_STAGE_STRIPE_TOKEN',
    production: 'VITE_PROD_STRIPE_TOKEN'
  }

  const enviromentStripeToken = stripeEnvVarName[environment]

  if (!environment) {
    throw Error('Provide an environment to select correct tracking token')
  }
  const isInvalidEnvironment = !['development', 'stage', 'production'].includes(environment)
  if (isInvalidEnvironment) {
    throw Error('Provide an valid environment to select correct tracking token')
  }

  const stripeToken = import.meta.env[enviromentStripeToken]
  if (!stripeToken) {
    throw Error('Stripe token is missing, cannot load Stripe')
  }
  const stripePromise = loadStripe(stripeToken)

  return stripePromise
}
