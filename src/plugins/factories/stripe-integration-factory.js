import { loadStripe } from '@stripe/stripe-js'

const getStripeTokenFromEnv = (envVar) => {
  return import.meta.env[envVar] || null
}

const environment = {
  development: {
    stripeToken: () => getStripeTokenFromEnv('VITE_DEV_STRIPE_TOKEN')
  },
  stage: {
    stripeToken: () => getStripeTokenFromEnv('VITE_STAGE_STRIPE_TOKEN')
  },
  production: {
    stripeToken: () => getStripeTokenFromEnv('VITE_PROD_STRIPE_TOKEN')
  }
}

function getStripeToken(env) {
  return environment[env].stripeToken()
}

export function makeStripeClient(environment) {
  if (!environment) {
    throw Error('Provide an environment to select correct tracking token')
  }
  const isInvalidEnvironment = !['development', 'stage', 'production'].includes(environment)
  if (isInvalidEnvironment) {
    throw Error('Provide an valid environment to select correct tracking token')
  }

  const stripeToken = getStripeToken(environment)
  if (!stripeToken) {
    throw Error('Stripe token is missing, cannot load Stripe')
  }
  const stripePromise = loadStripe(stripeToken)

  return stripePromise
}
