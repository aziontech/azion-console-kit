// Vue Query intentionally not used: this is a fire-and-forget Stripe.js SDK
// loader, not a server data fetch — there is no response to cache, dedupe, or
// expose as reactive state. Deduplication is handled by loadStripe internally.
// eslint-disable-next-line azion-architecture/require-vue-query
import { warmStripeClient } from '@/services/billing-services'

/**
 * Component-facing entry point for pre-downloading Stripe.js on the screen that
 * precedes a payment form (signup additional-data step, billing overview).
 * Keeps the service import in the composable layer so views don't reach into
 * `@/services/billing-services` directly. The warmer is fire-and-forget and
 * dedupes through `loadStripe`'s internal script-injection memoization, so it
 * is safe to call on every mount.
 */
export function useWarmStripe() {
  return { warmStripe: warmStripeClient }
}
