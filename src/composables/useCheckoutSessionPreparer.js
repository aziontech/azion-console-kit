import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useServiceOrders } from '@/composables/useServiceOrders'
import { ensurePlansList, getPlanPricingId } from '@/composables/usePlansService'
// eslint-disable-next-line azion-architecture/require-vue-query
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { loadUserAndAccountInfo } from '@/helpers/account-data'

/**
 * Resolves the Stripe `clientSecret` for a given plan **before** the checkout
 * UI mounts. Mirrors the working signup pattern (PR #3511 / feat/new-plans):
 * fetch the service-order + client secret first, then render the payment
 * block already populated. Avoids the "open empty → fetch async → hope the
 * payment-element watch fires in time" race that left the Stripe element
 * stuck in skeleton.
 *
 * The function consolidates the lifecycle handled previously inside
 * `DrawerPlanInfo`:
 *   - Loads the plans catalogue if missing
 *   - Loads `/info` if the address data isn't in the store yet
 *   - Reuses any pending DRAFT (cycle + plan match → live Stripe session)
 *   - PATCHes the DRAFT when plan/cycle drift
 *   - Falls back to POST (no contract) or PATCH /upgrade (ACTIVE plan)
 *
 * @returns {{
 *   isPreparing: import('vue').Ref<boolean>,
 *   prepare: (params: { plan: string, preferredCycle?: string|null }) => Promise<string>
 * }}
 */
export function useCheckoutSessionPreparer() {
  const accountStore = useAccountStore()
  const { createServiceOrder, upgrade, getServiceOrder, serviceOrder } = useServiceOrders()

  const isPreparing = ref(false)

  // The Stripe SDK accepts the same clientSecret either at the top-level
  // `payment` field (when the backend emits it explicitly) or inside the SO
  // (extracted by ServiceOrdersAdapter from `metadata.client_secret`). The
  // helper merges both shapes so callers don't have to fan out.
  const extractSecret = (response) =>
    response?.payment?.clientSecret ||
    response?.data?.payment?.clientSecret ||
    response?.data?.clientSecret ||
    response?.serviceOrder?.clientSecret ||
    ''

  // In-flight prepare and the (plan, cycle) key it was started with. Used to
  // deduplicate concurrent calls (e.g. a double-click on Upgrade): callers
  // hitting the same key share the same promise instead of failing, and a
  // call with a different key serializes behind the previous one.
  let inFlightPromise = null
  let inFlightKey = ''

  const runPrepare = async ({ plan, cycle }) => {
    // Cache-aware load — returns the cached catalogue when fresh (staleTime
    // 1h), dedupes concurrent network calls, and only fetches when missing
    // or stale. Replaces the previous `usePlansList({ enabled: false }) +
    // refetch()` pattern, where `refetch` always bypassed the cache.
    const plans = await ensurePlansList()

    if (!accountStore.accountData?.country) {
      await loadUserAndAccountInfo()
    }

    const accountId = accountStore.accountData?.id
    if (!accountId) {
      throw new Error('Account data not available yet.')
    }

    const planId = plans?.find((item) => item.sku?.toLowerCase() === plan.toLowerCase())?.id
    const planPricingId = getPlanPricingId(plans, plan, cycle)

    if (!planId || !planPricingId) {
      throw new Error(`Plan pricing not found for ${plan} (${cycle}).`)
    }

    const draftsResponse = await serviceOrdersService.listServiceOrders({
      accountId,
      status: 'DRAFT'
    })
    const existingDraft = draftsResponse?.data?.[0] ?? null

    if (existingDraft?.serviceOrderId) {
      const draft = await getServiceOrder(existingDraft.serviceOrderId)

      if (draft?.planId === planId && draft?.priceId === planPricingId && draft?.clientSecret) {
        return draft.clientSecret
      }

      const updateResponse = await serviceOrdersService.updateServiceOrder(
        existingDraft.serviceOrderId,
        { accountId, planId, planPricingId }
      )
      if (updateResponse?.data) {
        serviceOrder.value = updateResponse.data
      }
      const refreshedSecret = extractSecret(updateResponse)
      if (refreshedSecret) return refreshedSecret
      throw new Error('Unable to refresh the existing checkout session.')
    }

    const activeResponse = await serviceOrdersService.listServiceOrders({
      accountId,
      status: 'ACTIVE'
    })
    const activeSO = activeResponse?.data?.[0] ?? null

    const response = activeSO?.serviceOrderId
      ? await upgrade({
          id: activeSO.serviceOrderId,
          accountId,
          newPlanId: planId,
          priceId: planPricingId
        })
      : await createServiceOrder({ accountId, planId, planPricingId })

    const secret = extractSecret(response)
    if (!secret) {
      throw new Error('Payment session client secret missing in response.')
    }
    return secret
  }

  const prepare = async ({ plan, preferredCycle = null }) => {
    const cycle = preferredCycle || 'monthly'
    const key = `${plan}:${cycle}`

    // Same params already in flight (e.g. double-clicked Upgrade) → share
    // the existing promise so both callers resolve to the same secret.
    if (inFlightPromise && inFlightKey === key) {
      return inFlightPromise
    }

    // Different params while another prepare runs → wait for the chain tail
    // to settle before starting a fresh one. Re-read `inFlightPromise` each
    // iteration to ride the latest tail when multiple callers queue up.
    while (inFlightPromise) {
      const prior = inFlightPromise
      try {
        await prior
      } catch {
        // Prior's caller already owns this rejection.
      }
      if (inFlightPromise === prior) break
    }

    // Another waiter may have queued the same key ahead of us — reuse it.
    if (inFlightPromise && inFlightKey === key) {
      return inFlightPromise
    }

    inFlightKey = key
    isPreparing.value = true
    inFlightPromise = runPrepare({ plan, cycle }).finally(() => {
      inFlightPromise = null
      inFlightKey = ''
      isPreparing.value = false
    })

    return inFlightPromise
  }

  return {
    isPreparing,
    prepare
  }
}
