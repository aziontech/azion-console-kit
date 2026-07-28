import { computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useAccountStore } from '@/stores/account'
import { useSubscriptionPlanChange } from '@/composables/useSubscriptionPlanChange'
import { useWalletMutations } from '@/composables/billing/useWallet'
import { ensureCurrentSubscription } from '@/composables/useSubscriptionState'
import { ensurePlansList } from '@/composables/usePlansService'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { toBillingPeriod } from '@/services/v2/utils/billing-period'
import { SUBSCRIPTION_STATUS } from '@/services/v2/billing-api/subscriptions/subscriptions-constants'

const resolvePlan = (plans, sku) =>
  plans?.find((item) => item.sku?.toLowerCase() === String(sku).toLowerCase()) ?? null

export const prepareCheckoutSessionForSubscription = async ({
  plan,
  cycle,
  plans,
  ensureSubscription,
  createSubscription,
  createCardSetupSession
}) => {
  const catalogPlan = resolvePlan(plans, plan)
  const planId = catalogPlan?.id
  const period = toBillingPeriod(cycle)

  if (!planId || !period) {
    throw new Error(`Plan pricing not found for ${plan} (${cycle}).`)
  }

  const current = await ensureSubscription()
  const subscription = current?.data ?? null

  if (subscription && subscription.status !== SUBSCRIPTION_STATUS.CANCELLED) {
    const session = await createCardSetupSession()
    const secret = session?.clientSecret ?? session?.data?.clientSecret ?? ''
    if (!secret) throw new Error('Unable to start the card capture session.')
    return secret
  }

  const response = await createSubscription({ planId, period })
  const secret = response?.payment?.clientSecret ?? ''

  if (!secret) {
    throw new Error('Payment session client secret missing in response.')
  }
  return secret
}

/**
 * Prepares the Stripe client secret the plan drawer mounts.
 *
 * With no subscription yet, `POST /v4/account/subscriptions` creates it as
 * `incomplete` and returns the client secret for the first payment. When a
 * subscription already exists the plan change is local pro-rata, so the drawer
 * only needs to capture a card (setup session) — committing the plan is the
 * caller's job, via `useSubscriptionPlanChange().applyChange`.
 *
 * Callers that can fire multiple preparations in parallel must keep their own
 * "latest request wins" guard before applying returned secrets.
 */
export function useCheckoutSessionPreparer() {
  const accountStore = useAccountStore()
  const { createSubscription } = useSubscriptionPlanChange()
  const { createSetupIntent } = useWalletMutations()

  const prepareMutation = useMutation({
    mutationFn: async ({ plan, cycle }) => {
      const plans = await ensurePlansList()

      if (!accountStore.accountData?.country) {
        await loadUserAndAccountInfo()
      }

      if (!accountStore.accountData?.id) {
        throw new Error('Account data not available yet.')
      }

      return prepareCheckoutSessionForSubscription({
        plan,
        cycle,
        plans,
        ensureSubscription: ensureCurrentSubscription,
        createSubscription,
        createCardSetupSession: createSetupIntent
      })
    }
  })

  const prepare = ({ plan, preferredCycle = null }) =>
    prepareMutation.mutateAsync({ plan, cycle: preferredCycle || 'monthly' })

  /**
   * Recovery path for when Stripe rejects the secret returned by `prepare`
   * (`No such checkout.session`, `resource_missing`, etc). Drops the cached
   * subscription snapshot so the next `prepare` reads server truth, then
   * re-prepares.
   */
  const recoverFromStaleSession = async ({ plan, preferredCycle = null }) => {
    const { invalidateSubscriptionState } = await import('@/composables/useSubscriptionState')
    invalidateSubscriptionState()
    return prepare({ plan, preferredCycle })
  }

  return {
    isPreparing: computed(() => prepareMutation.isPending.value),
    prepare,
    recoverFromStaleSession
  }
}
