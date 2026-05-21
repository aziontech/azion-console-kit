import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { useServiceOrdersList } from '@/composables/useServiceOrdersList'
import { usePlansList } from '@/composables/usePlansService'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import {
  findPlanById,
  findPricingById,
  formatPlanStartDate,
  resolvePlanSku,
  toFiniteNumber
} from '@/composables/subscription-helpers'
import { formatBillingPeriod, formatLastUpdate, formatNextChargeDate } from '@/utils/billing-date'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const isActivePopulated = (so) => Boolean(so?.priceId && so?.currentPeriodEnd)

/**
 * Subscription state derived from the cached service-orders list. All data
 * flows through Vue Query — there is no manual polling loop or singleton
 * tracking state. Server-side changes invalidate the cache via the SSE
 * prefetch pipeline (see `prefetch-registrations.js`), and any mutation
 * `onSuccess` invalidates `queryKeys.serviceOrders.all` to refresh derived
 * computeds automatically.
 */
export function useCurrentSubscription() {
  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)

  const accountId = computed(() => accountData.value?.id ?? null)
  const hasFinishedOnboarding = computed(() => accountData.value?.hasAccountPlan !== false)
  const hasContractedPlan = hasFinishedOnboarding

  const {
    activeServiceOrder,
    currentServiceOrder,
    isLoading: isLoadingServiceOrder,
    refetch: refetchServiceOrders
  } = useServiceOrdersList(accountId)

  // Plans are only needed to enrich the active SO with pricing/sku metadata.
  // Gating with `enabled` keeps the catalogue request off the wire while the
  // account is still hydrating or has no active SO yet.
  const plansQueryEnabled = computed(
    () => Boolean(accountId.value) && hasContractedPlan.value && Boolean(activeServiceOrder.value)
  )
  const { data: plansData, isLoading: isLoadingPlans } = usePlansList({ enabled: plansQueryEnabled })

  const planSku = computed(() => {
    if (isLoadingServiceOrder.value) return null
    const so = activeServiceOrder.value
    if (!so) return 'hobby'
    const plan = findPlanById(plansData.value, so.planId)
    return resolvePlanSku(plan)
  })

  const activePricing = computed(() =>
    findPricingById(plansData.value, activeServiceOrder.value?.priceId)
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
    formatPlanStartDate(activeServiceOrder.value?.currentPeriodStart)
  )
  const billingPeriod = computed(() =>
    formatBillingPeriod(
      activeServiceOrder.value?.currentPeriodStart,
      activeServiceOrder.value?.currentPeriodEnd
    )
  )
  const nextChargeDate = computed(() =>
    formatNextChargeDate(activeServiceOrder.value?.currentPeriodEnd)
  )
  const nextChargeValue = computed(() => planChargeValue.value)
  const lastUpdate = computed(() =>
    formatLastUpdate(currentServiceOrder.value?.updatedAt ?? activeServiceOrder.value?.updatedAt)
  )

  const scheduledDowngrade = computed(() => {
    const metadata = activeServiceOrder.value?.metadata
    if (!metadata || typeof metadata !== 'object') return null
    if (metadata.status !== 'downgrade_pending') return null
    return {
      effectiveAt: metadata.effective_date ?? metadata.effectiveDate ?? null
    }
  })

  const currentInvoiceAmountCharged = computed(() => {
    const metadata = activeServiceOrder.value?.metadata
    if (!metadata || typeof metadata !== 'object') return null
    const raw = metadata.amountCharged ?? metadata.amount_charged
    return toFiniteNumber(raw, null)
  })

  const isDowngradePending = computed(() => Boolean(scheduledDowngrade.value))

  const isLoading = computed(() => {
    if (!accountId.value) return true
    if (!hasContractedPlan.value) return false
    return isLoadingServiceOrder.value || (plansQueryEnabled.value && isLoadingPlans.value)
  })

  const refetch = async () => {
    await loadUserAndAccountInfo({ force: true })
    if (!accountId.value || !hasContractedPlan.value) return
    queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })
    await refetchServiceOrders()
  }

  // Kept for transitional callers that want a one-shot freshness check after
  // an external event (e.g., post-checkout return). It no longer loops —
  // mutations should invalidate the cache; SSE drives background refresh.
  const refetchUntil = async (predicate) => {
    await refetch()
    return predicate ? Boolean(predicate(activeServiceOrder.value)) : true
  }

  return {
    planSku,
    billingCycle,
    planChargeValue,
    planTitle,
    planTag,
    planStartDate,
    billingPeriod,
    nextChargeDate,
    nextChargeValue,
    lastUpdate,
    hasContractedPlan,
    isHobby,
    isPro,
    isLoading,
    isDowngradePending,
    scheduledDowngrade,
    currentInvoiceAmountCharged,
    isActivePopulated: computed(() => isActivePopulated(activeServiceOrder.value)),
    refetch,
    refetchUntil
  }
}
