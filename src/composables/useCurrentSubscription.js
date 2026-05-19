import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { useServiceOrders } from '@/composables/useServiceOrders'
import { usePlansList } from '@/composables/usePlansService'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import {
  findPlanById,
  findPricingById,
  formatPlanStartDate,
  isActiveServiceOrder,
  resolvePlanSku,
  toFiniteNumber
} from '@/composables/subscription-helpers'
import { formatBillingPeriod, formatLastUpdate, formatNextChargeDate } from '@/utils/billing-date'

const isRefetching = ref(false)

export function useCurrentSubscription() {
  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)

  const hasFinishedOnboarding = computed(() => accountData.value?.has_service_order_plan !== false)
  const hasContractedPlan = hasFinishedOnboarding

  const {
    serviceOrder,
    isLoading: isLoadingServiceOrder,
    loadAccountServiceOrders
  } = useServiceOrders()
  const { data: plansData, isLoading: isLoadingPlans } = usePlansList()

  const activeServiceOrderState = ref(
    isActiveServiceOrder(serviceOrder.value) ? serviceOrder.value : null
  )

  watch(serviceOrder, (so) => {
    if (isActiveServiceOrder(so)) {
      activeServiceOrderState.value = so
    } else if (so === null) {
      activeServiceOrderState.value = null
    }
  })

  watch(
    () => [accountData.value?.id, hasFinishedOnboarding.value],
    ([accountId, finishedOnboarding]) => {
      if (!accountId || !finishedOnboarding) return
      if (activeServiceOrderState.value || isLoadingServiceOrder.value) return
      loadAccountServiceOrders(accountId).catch(() => {})
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
  const billingPeriod = computed(() =>
    formatBillingPeriod(
      activeServiceOrderState.value?.currentPeriodStart,
      activeServiceOrderState.value?.currentPeriodEnd
    )
  )
  const nextChargeDate = computed(() =>
    formatNextChargeDate(activeServiceOrderState.value?.currentPeriodEnd)
  )
  const nextChargeValue = computed(() => planChargeValue.value)
  const lastUpdate = computed(() =>
    formatLastUpdate(serviceOrder.value?.updatedAt ?? activeServiceOrderState.value?.updatedAt)
  )

  const scheduledDowngrade = computed(() => {
    const metadata = activeServiceOrderState.value?.metadata
    if (!metadata || typeof metadata !== 'object') return null
    if (metadata.status !== 'downgrade_pending') return null
    return {
      effectiveAt: metadata.effective_date ?? metadata.effectiveDate ?? null
    }
  })

  const isDowngradePending = computed(() => Boolean(scheduledDowngrade.value))

  const hasResolvedOnce = ref(false)
  watch(
    () => planSku.value,
    (sku) => {
      if (sku !== null) hasResolvedOnce.value = true
    },
    { immediate: true }
  )
  watch(
    () => accountData.value?.id,
    (newId, oldId) => {
      if (newId !== oldId) hasResolvedOnce.value = false
    }
  )

  const isLoading = computed(() => {
    if (isRefetching.value) return true
    if (!accountData.value?.id) return true
    if (!hasContractedPlan.value) return false
    if (hasResolvedOnce.value) return false
    return isLoadingServiceOrder.value || isLoadingPlans.value || planSku.value === null
  })

  const reloadFromBackend = async () => {
    await loadUserAndAccountInfo({ force: true })
    const accountId = accountData.value?.id
    if (accountId && hasContractedPlan.value) {
      await loadAccountServiceOrders(accountId)
    }
  }

  const refetch = async () => {
    isRefetching.value = true
    try {
      await reloadFromBackend()
    } finally {
      isRefetching.value = false
    }
  }

  const refetchUntil = async (predicate, { interval = 1500, maxAttempts = 8 } = {}) => {
    isRefetching.value = true
    try {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await reloadFromBackend()
        if (predicate(activeServiceOrderState.value)) return true
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval))
        }
      }
      return false
    } finally {
      isRefetching.value = false
    }
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
    refetch,
    refetchUntil
  }
}
