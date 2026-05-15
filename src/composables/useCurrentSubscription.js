import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { useServiceOrders } from '@/composables/useServiceOrders'
import { usePlansList } from '@/composables/usePlansService'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import {
  findPlanById,
  findPricingById,
  formatPlanStartDate,
  isActiveServiceOrder,
  resolvePlanSku,
  toFiniteNumber
} from '@/composables/subscription-helpers'

const isRefreshing = ref(false)

/**
 * Resolves the current plan for the billing UI.
 *
 * Source of truth: the ACTIVE service order. `/info.has_service_order_plan`
 * is intentionally NOT consulted for the plan SKU — it can stay `true` after
 * the ACTIVE SO is canceled, which previously made the badge claim "Pro"
 * off of a stale DRAFT. The flag is used only as an optimization gate to
 * skip the SO fetch while the account is still in the signup flow.
 */
export function useCurrentSubscription() {
  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)

  const hasFinishedOnboarding = computed(() => accountData.value?.has_service_order_plan !== false)
  // Preserved name for backwards compatibility with consumers (BillsView etc.)
  const hasContractedPlan = hasFinishedOnboarding

  const { serviceOrder, isLoading: isLoadingServiceOrder, loadServiceOrder } = useServiceOrders()
  const { data: plansData, isLoading: isLoadingPlans } = usePlansList()

  // The SO ref in useServiceOrders is a module-level singleton — a DRAFT
  // created elsewhere (e.g. the change-plan drawer) can leak in. Gate every
  // derived field on the ACTIVE status to avoid reading the wrong SO.
  const activeServiceOrderState = computed(() =>
    isActiveServiceOrder(serviceOrder.value) ? serviceOrder.value : null
  )

  // Concurrent calls dedupe via `queryClient.fetchQuery` inside
  // `loadServiceOrder` (same query key → shared in-flight promise).
  watch(
    () => [accountData.value?.id, hasFinishedOnboarding.value],
    ([accountId, finishedOnboarding]) => {
      if (!accountId || !finishedOnboarding) return
      if (activeServiceOrderState.value || isLoadingServiceOrder.value) return
      loadServiceOrder(accountId, {
        preferStatus: SO_STATUS.ACTIVE,
        noFallback: true
      }).catch(() => {})
    },
    { immediate: true }
  )

  const planSku = computed(() => {
    if (isLoadingServiceOrder.value) return null
    const so = activeServiceOrderState.value
    if (!so) return 'hobby'
    const plan = findPlanById(plansData.value, so.planId)
    return resolvePlanSku(plan)
  })

  const activePricing = computed(() =>
    findPricingById(plansData.value, activeServiceOrderState.value?.priceId)
  )

  const billingCycle = computed(() => activePricing.value?.periodicity ?? null)

  const planChargeValue = computed(() => {
    if (!hasContractedPlan.value) return 0
    return toFiniteNumber(activePricing.value?.priceValue, 0)
  })

  const isPro = computed(() => planSku.value === 'pro')
  const isHobby = computed(() => planSku.value === 'hobby')

  const planTitle = computed(() => (isPro.value ? 'Pro Plan' : 'Hobby'))
  const planTag = computed(() => (isHobby.value ? 'Free Plan' : null))

  const planStartDate = computed(() =>
    formatPlanStartDate(activeServiceOrderState.value?.currentPeriodStart)
  )
  const nextChargeDate = computed(() => null)
  const nextChargeValue = computed(() => planChargeValue.value)

  const isLoading = computed(() => {
    if (isRefreshing.value) return true
    if (!accountData.value?.id) return true
    if (!hasContractedPlan.value) return false
    return isLoadingServiceOrder.value || isLoadingPlans.value || planSku.value === null
  })

  /**
   * Refresh the source of truth (`/info` + ACTIVE SO). Bypasses Vue Query
   * cache since `has_service_order_plan` flips on the backend immediately
   * after a transition — a cached value would mislead the billing UI.
   */
  const refetch = async () => {
    await loadUserAndAccountInfo({ force: true })
    const accountId = accountData.value?.id
    if (accountId && hasContractedPlan.value) {
      await loadServiceOrder(accountId, { preferStatus: SO_STATUS.ACTIVE, noFallback: true })
    }
  }

  /**
   * Refetch until `predicate({ planSku, billingCycle })` returns true. Used
   * after payment — the Stripe webhook transitions the new DRAFT to ACTIVE
   * asynchronously, so an immediate refetch often returns the old plan.
   */
  const refetchUntil = async (predicate, options = {}) => {
    const { attempts = 8, delayMs = 1500 } = options
    isRefreshing.value = true
    try {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await refetch()
        if (predicate({ planSku: planSku.value, billingCycle: billingCycle.value })) {
          return true
        }
        if (attempt < attempts - 1) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
      return false
    } finally {
      isRefreshing.value = false
    }
  }

  return {
    planSku,
    billingCycle,
    planChargeValue,
    planTitle,
    planTag,
    planStartDate,
    nextChargeDate,
    nextChargeValue,
    hasContractedPlan,
    isHobby,
    isPro,
    isLoading,
    refetch,
    refetchUntil
  }
}
