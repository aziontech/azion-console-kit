import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import * as Sentry from '@sentry/vue'
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
import {
  clearAwaitingActiveServiceOrder,
  isAwaitingActiveServiceOrder
} from '@/composables/post-payment-flag'

const isRefetching = ref(false)
const isPollingForActive = ref(false)
let postPaymentPollAttempted = false
const POST_PAYMENT_POLL_INTERVAL = 2000
const POST_PAYMENT_POLL_MAX_ATTEMPTS = 6

export function useCurrentSubscription() {
  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)

  const accountId = computed(() => accountData.value?.id ?? null)
  const hasFinishedOnboarding = computed(() => accountData.value?.hasAccountPlan !== false)
  const hasContractedPlan = hasFinishedOnboarding

  const {
    activeServiceOrder,
    draftServiceOrder,
    currentServiceOrder,
    isLoading: isLoadingServiceOrder,
    isFetching: isFetchingServiceOrder,
    refetch: refetchServiceOrders
  } = useServiceOrdersList(accountId)
  const { data: plansData, isLoading: isLoadingPlans } = usePlansList()

  const pollForActiveAfterPayment = async () => {
    if (isPollingForActive.value) return
    if (activeServiceOrder.value) {
      clearAwaitingActiveServiceOrder()
      return
    }
    if (!draftServiceOrder.value?.priceId) {
      clearAwaitingActiveServiceOrder()
      return
    }

    isPollingForActive.value = true
    try {
      for (let attempt = 0; attempt < POST_PAYMENT_POLL_MAX_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, POST_PAYMENT_POLL_INTERVAL))
        await refetchServiceOrders().catch(Sentry.captureException)
        if (activeServiceOrder.value) {
          clearAwaitingActiveServiceOrder()
          return
        }
      }
      clearAwaitingActiveServiceOrder()
    } finally {
      isPollingForActive.value = false
    }
  }

  watch(
    () => [isFetchingServiceOrder.value, accountId.value, hasFinishedOnboarding.value],
    ([fetching, id, finishedOnboarding]) => {
      if (postPaymentPollAttempted) return
      if (fetching) return
      if (!id || !finishedOnboarding) return
      if (!isAwaitingActiveServiceOrder()) return
      postPaymentPollAttempted = true
      if (activeServiceOrder.value) {
        clearAwaitingActiveServiceOrder()
        return
      }
      if (!draftServiceOrder.value?.priceId) {
        clearAwaitingActiveServiceOrder()
        return
      }
      pollForActiveAfterPayment()
    },
    { immediate: true }
  )

  watch(activeServiceOrder, (active) => {
    if (active) clearAwaitingActiveServiceOrder()
  })

  watch(accountId, (newId, oldId) => {
    if (newId !== oldId) postPaymentPollAttempted = false
  })

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

  const hasResolvedOnce = ref(false)
  watch(
    () => planSku.value,
    (sku) => {
      if (sku !== null) hasResolvedOnce.value = true
    },
    { immediate: true }
  )
  watch(accountId, (newId, oldId) => {
    if (newId !== oldId) hasResolvedOnce.value = false
  })

  const isLoading = computed(() => {
    if (isRefetching.value) return true
    if (!accountId.value) return true
    if (!hasContractedPlan.value) return false
    if (hasResolvedOnce.value) return false
    return isLoadingServiceOrder.value || isLoadingPlans.value || planSku.value === null
  })

  const reloadFromBackend = async () => {
    await loadUserAndAccountInfo({ force: true })
    if (accountId.value && hasContractedPlan.value) {
      await refetchServiceOrders()
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
        if (predicate(activeServiceOrder.value)) return true
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
    currentInvoiceAmountCharged,
    refetch,
    refetchUntil
  }
}
