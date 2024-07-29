import { loadStripe } from '@stripe/stripe-js'

const environment = {
  development: {
    stripeToken: import.meta.env.VITE_STAGE_STRIPE_TOKEN
  },
  stage: {
    stripeToken: import.meta.env.VITE_STAGE_STRIPE_TOKEN
  },
  production: {
    stripeToken: import.meta.env.VITE_PROD_STRIPE_TOKEN
  }
}

function getStripeToken(env) {
  return environment[env].stripeToken
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
  const stripePromise = loadStripe(stripeToken)

  return stripePromise
}
