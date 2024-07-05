import { getEnvironment } from '@/helpers'
import { makeStripeClient } from './factories/stripe-integration-factory'

/**@type {import('vue').Plugin} */
export default {
  // eslint-disable-next-line no-unused-vars
  install: (Vue, options) => {
    const environment = getEnvironment()

    const stripeClient = makeStripeClient(environment)

    const app = Vue
    app.config.globalProperties.$stripe = stripeClient
    app.provide('stripe', stripeClient)
  }
}