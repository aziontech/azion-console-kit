import { loadStripe } from '@stripe/stripe-js'

const environment = {
  development: {
    stripeToken: 'pk_test'
  },
  stage: {
    stripeToken: ''
  },
  production: {
    stripeToken: ''
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
