import { computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useAccountStore } from '@/stores/account'
import { useServiceOrders } from '@/composables/useServiceOrders'
import { ensureServiceOrdersList, getCurrentServiceOrder } from '@/composables/useServiceOrdersList'
import { ensurePlansList, getPlanPricingId } from '@/composables/usePlansService'
import { invalidateCurrentAccountSubscription } from '@/composables/useCurrentAccountSubscriptionService'
import { SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const extractSecret = (response) =>
  response?.payment?.clientSecret ||
  response?.data?.payment?.clientSecret ||
  response?.data?.clientSecret ||
  response?.serviceOrder?.clientSecret ||
  ''

export const prepareCheckoutSessionForServiceOrder = async ({
  accountId,
  plan,
  cycle,
  plans,
  draftServiceOrderId,
  signup,
  ensureServiceOrdersList,
  getCurrentServiceOrder,
  createServiceOrder,
  prepareSignupCheckout,
  updateServiceOrder,
  upgrade
}) => {
  const planId = plans?.find((item) => item.sku?.toLowerCase() === plan.toLowerCase())?.id
  const planPricingId = getPlanPricingId(plans, plan, cycle)

  if (!planId || !planPricingId) {
    throw new Error(`Plan pricing not found for ${plan} (${cycle}).`)
  }

  if (signup) {
    const prepareResponse = await prepareSignupCheckout({
      planId,
      planPricingId
    })
    const signupSecret = extractSecret(prepareResponse)
    if (signupSecret) return signupSecret
    throw new Error('Payment session client secret missing in response.')
  }

  if (draftServiceOrderId) {
    const updateResponse = await updateServiceOrder(draftServiceOrderId, {
      planId,
      planPricingId
    })
    const refreshedSecret = extractSecret(updateResponse)
    if (refreshedSecret) return refreshedSecret
    throw new Error('Unable to refresh the existing checkout session.')
  }

  await ensureServiceOrdersList(accountId)
  const currentSO = getCurrentServiceOrder(accountId)

  if (currentSO?.status === SO_STATUS.DRAFT && currentSO.serviceOrderId) {
    const updateResponse = await updateServiceOrder(currentSO.serviceOrderId, {
      planId,
      planPricingId
    })
    const refreshedSecret = extractSecret(updateResponse)
    if (refreshedSecret) return refreshedSecret
    throw new Error('Unable to refresh the existing checkout session.')
  }

  const response =
    currentSO?.status === SO_STATUS.ACTIVE && currentSO.serviceOrderId
      ? await upgrade({
          id: currentSO.serviceOrderId,
          accountId,
          newPlanId: planId,
          priceId: planPricingId
        })
      : await createServiceOrder({ planId, planPricingId })

  const secret = extractSecret(response)
  if (!secret) {
    throw new Error('Payment session client secret missing in response.')
  }
  return secret
}

/**
 * Prepares a Stripe checkout session for the requested plan/cycle. When a
 * DRAFT service order already exists for the same plan, this issues a PATCH
 * to refresh the Stripe session instead of trusting the cached client
 * secret — Stripe Checkout Sessions expire (~24h) and may have been
 * consumed since the last time the cache was warmed. The PATCH is cheap
 * compared to the bug surface of mounting Stripe.js with a dead secret.
 *
 * Callers that can fire multiple preparations in parallel must keep their
 * own "latest request wins" guard before applying returned secrets.
 */
export function useCheckoutSessionPreparer() {
  const accountStore = useAccountStore()
  const { createServiceOrder, prepareSignupCheckout, updateServiceOrder, upgrade } =
    useServiceOrders()

  const prepareMutation = useMutation({
    mutationFn: async ({ plan, cycle, draftServiceOrderId, signup }) => {
      const plans = await ensurePlansList()

      if (!accountStore.accountData?.country) {
        await loadUserAndAccountInfo()
      }

      const accountId = accountStore.accountData?.id
      if (!accountId) {
        throw new Error('Account data not available yet.')
      }

      return prepareCheckoutSessionForServiceOrder({
        accountId,
        plan,
        cycle,
        plans,
        draftServiceOrderId,
        signup,
        ensureServiceOrdersList,
        getCurrentServiceOrder,
        createServiceOrder,
        prepareSignupCheckout,
        updateServiceOrder,
        upgrade
      })
    }
  })

  const prepare = ({ plan, preferredCycle = null, draftServiceOrderId = null, signup = false }) =>
    prepareMutation.mutateAsync({
      plan,
      cycle: preferredCycle || 'monthly',
      draftServiceOrderId,
      signup
    })

  /**
   * Recovery path for when Stripe rejects the secret returned by `prepare`
   * (`No such checkout.session`, `resource_missing`, etc). Drops the cached
   * SO snapshots so the next `prepare` reads server-truth, then re-prepares
   * — yielding a brand-new Stripe Checkout Session.
   */
  const recoverFromStaleSession = ({
    plan,
    preferredCycle = null,
    draftServiceOrderId = null,
    signup = false
  }) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })
    invalidateCurrentAccountSubscription()
    return prepare({ plan, preferredCycle, draftServiceOrderId, signup })
  }

  return {
    isPreparing: computed(() => prepareMutation.isPending.value),
    prepare,
    recoverFromStaleSession
  }
}
