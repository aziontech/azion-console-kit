import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { useSubscriptionState } from '@/composables/useSubscriptionState'
import { useScheduledChanges } from '@/composables/useSubscriptionPlanChange'
import { usePlansList } from '@/composables/usePlansService'
import { toBillingPeriod, toCataloguePeriodicity } from '@/services/v2/utils/billing-period'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import {
  findPlanById,
  formatPlanStartDate,
  resolvePlanSku,
  toFiniteNumber
} from '@/composables/subscription-helpers'
import { formatBillingPeriod, formatLastUpdate, formatNextChargeDate } from '@/utils/billing-date'

const findPricing = (plan, period) => {
  const pricings = plan?.pricings ?? []
  const target = toBillingPeriod(period)
  if (!target) return null
  return pricings.find((pricing) => toBillingPeriod(pricing.periodicity) === target) ?? null
}

/**
 * Subscription state for the plans experience, read straight from billing-api
 * v4: `subscriptions/current` carries the lifecycle AND the plan identity
 * (`plan_id`, `plan_pricing_id`, `renew`, `pending_transition`); the
 * products-api catalogue resolves names and prices from those ids.
 */
export function useCurrentSubscription() {
  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)

  const accountId = computed(() => accountData.value?.id ?? null)

  const {
    subscription,
    subscriptionId,
    planId,
    planPricingId,
    pendingTransition,
    hasSubscription,
    isUnavailable,
    isLoading: isLoadingSubscription,
    refetch: refetchSubscription
  } = useSubscriptionState({ enabled: computed(() => Boolean(accountId.value)) })

  const hasContractedPlan = hasSubscription

  const plansQueryEnabled = computed(() => Boolean(accountId.value) && hasSubscription.value)
  const { data: plansData, isLoading: isLoadingPlans } = usePlansList({
    enabled: plansQueryEnabled
  })

  const activePlan = computed(() => findPlanById(plansData.value, planId.value))

  const activePricingById = computed(
    () => activePlan.value?.pricings?.find((pricing) => pricing.id === planPricingId.value) ?? null
  )

  const period = computed(
    () => toBillingPeriod(activePricingById.value?.periodicity ?? subscription.value?.renew) ?? null
  )

  const planSku = computed(() => {
    if (isLoadingSubscription.value || isUnavailable.value) return null
    if (!hasSubscription.value) return 'hobby'
    return resolvePlanSku(activePlan.value)
  })

  const activePricing = computed(
    () => activePricingById.value ?? findPricing(activePlan.value, period.value)
  )

  const billingCycle = computed(() => toCataloguePeriodicity(period.value))

  const planChargeValue = computed(() => {
    if (!hasContractedPlan.value) return 0
    return toFiniteNumber(activePricing.value?.priceValue, 0)
  })

  const isPro = computed(() => planSku.value === 'pro')
  const isHobby = computed(() => planSku.value === 'hobby')

  const planTitle = computed(() => {
    if (isPro.value) return 'Pro Plan'
    if (isHobby.value) return 'Hobby'
    return activePlan.value?.name ?? null
  })
  const planTag = computed(() => (hasContractedPlan.value ? 'Current Plan' : null))

  const planStartDate = computed(() => formatPlanStartDate(subscription.value?.currentPeriodStart))
  const billingPeriod = computed(() =>
    formatBillingPeriod(
      subscription.value?.currentPeriodStart,
      subscription.value?.currentPeriodEnd
    )
  )
  const nextChargeDate = computed(() => formatNextChargeDate(subscription.value?.currentPeriodEnd))
  const lastUpdate = computed(() => formatLastUpdate(subscription.value?.audit?.lastModified))

  const {
    pendingChange,
    refetch: refetchScheduledChanges,
    isLoading: isLoadingScheduledChanges
  } = useScheduledChanges(subscriptionId, {
    enabled: computed(() => Boolean(subscriptionId.value))
  })

  const scheduledDowngrade = computed(() => {
    const transition = pendingTransition.value
    if (transition?.toPlanId) {
      const toPlan = findPlanById(plansData.value, transition.toPlanId)
      const toPricing =
        toPlan?.pricings?.find((pricing) => pricing.id === transition.toPlanPricingId) ?? null
      return {
        id: pendingChange.value?.id ?? null,
        effectiveAt: transition.effectiveDate,
        toPlanId: transition.toPlanId,
        toPlanPricingId: transition.toPlanPricingId ?? null,
        toPeriod: toBillingPeriod(toPricing?.periodicity) ?? null
      }
    }

    const pending = pendingChange.value
    if (!pending) return null
    return {
      id: pending.id,
      effectiveAt: pending.effectiveAt,
      toPlanId: pending.change?.planId ?? null,
      toPlanPricingId: null,
      toPeriod: pending.change?.period ?? null
    }
  })

  const scheduledDowngradePricing = computed(() => {
    const scheduled = scheduledDowngrade.value
    if (!scheduled?.toPlanId) return null
    return findPricing(findPlanById(plansData.value, scheduled.toPlanId), scheduled.toPeriod)
  })

  const nextChargeValue = computed(() => {
    if (!hasContractedPlan.value) return 0
    const pricing = scheduledDowngradePricing.value ?? activePricing.value
    return toFiniteNumber(pricing?.priceValue, 0)
  })

  const isDowngradePending = computed(() => Boolean(scheduledDowngrade.value))

  const isLoading = computed(() => {
    if (!accountId.value) return true
    return isLoadingSubscription.value || (plansQueryEnabled.value && isLoadingPlans.value)
  })

  const refetch = async () => {
    await loadUserAndAccountInfo({ force: true })
    if (!accountId.value) return
    await refetchSubscription()
    if (subscriptionId.value) await refetchScheduledChanges()
  }

  const refetchUntil = async (predicate, { maxAttempts = 5, delayMs = 500 } = {}) => {
    await refetch()
    if (!predicate) return true
    let attempt = 1
    while (attempt < maxAttempts && !predicate(subscription.value, subscription.value)) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      await refetch()
      attempt += 1
    }
    return Boolean(predicate(subscription.value, subscription.value))
  }

  return {
    subscription,
    subscriptionId,
    planPricingId,
    pendingTransition,
    planId,
    period,
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
    isLoadingScheduledChanges,
    isDowngradePending,
    isUnavailable,
    scheduledDowngrade,
    refetchScheduledChanges,
    status: computed(() => subscription.value?.status ?? null),
    cancelAtPeriodEnd: computed(() => subscription.value?.autoRenew === false),
    isActivePopulated: computed(() =>
      Boolean(planId.value && subscription.value?.currentPeriodEnd)
    ),
    refetch,
    refetchUntil
  }
}
