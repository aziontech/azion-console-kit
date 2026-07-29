import { computed, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getActivePinia } from 'pinia'
import { subscriptionsService } from '@/services/v2/billing-api/subscriptions/subscriptions-service'
import { SUBSCRIPTION_ENTITLED_STATUSES } from '@/services/v2/billing-api/subscriptions/subscriptions-constants'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { isNotFound } from '@/services/v2/utils/is-not-found'
import { isNotImplemented } from '@/services/v2/utils/is-not-implemented'
import { useAccountStore } from '@/stores/account'

const NO_CACHE_META = { persist: false }

const NO_SUBSCRIPTION = { data: null }
const UNAVAILABLE = { data: null, unavailable: true }

const isConflict = (error) => error?.status === 409 || error?.statusCode === 409

const syncAccountMode = (subscription) => {
  if (!getActivePinia()) return
  useAccountStore().setSubscriptionAccountMode(subscription?.accountMode ?? null)
}

const fetchCurrentSubscription = async () => {
  try {
    const current = await subscriptionsService.getCurrentSubscription()
    syncAccountMode(current?.data)
    return current
  } catch (error) {
    if (isNotFound(error)) {
      syncAccountMode(null)
      return NO_SUBSCRIPTION
    }
    if (isConflict(error) || isNotImplemented(error)) return UNAVAILABLE
    throw error
  }
}

const currentSubscriptionQuery = () => ({
  queryKey: queryKeys.subscriptions.current(),
  queryFn: fetchCurrentSubscription,
  staleTime: 0,
  gcTime: 0,
  meta: NO_CACHE_META
})

export const isEntitled = (subscription) =>
  SUBSCRIPTION_ENTITLED_STATUSES.includes(subscription?.status)

/**
 * Current subscription — the single read the plans experience needs.
 *
 * The v1.0.0 `Subscription` carries the plan identity inline (`plan_id`,
 * `plan_pricing_id`, `renew`) plus `pending_transition` for a scheduled
 * downgrade, so no companion read is required.
 */
export function useSubscriptionState(options = {}) {
  const { enabled = true } = options

  const subscriptionQuery = useQuery({
    ...currentSubscriptionQuery(),
    enabled: computed(() => Boolean(unref(enabled))),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false
  })

  const subscription = computed(() => subscriptionQuery.data.value?.data ?? null)
  const isUnavailable = computed(() => subscriptionQuery.data.value?.unavailable === true)
  const subscriptionId = computed(() => subscription.value?.id ?? null)
  const planId = computed(() => subscription.value?.planId ?? null)
  const planPricingId = computed(() => subscription.value?.planPricingId ?? null)
  const accountMode = computed(() => subscription.value?.accountMode ?? null)
  const billingMode = computed(() => subscription.value?.billingMode ?? null)
  const pendingTransition = computed(() => subscription.value?.pendingTransition ?? null)

  const hasSubscription = computed(() => Boolean(subscription.value))
  const isActive = computed(() => isEntitled(subscription.value))

  const refetch = async () => {
    await subscriptionQuery.refetch()
  }

  return {
    subscriptionQuery,
    subscription,
    subscriptionId,
    planId,
    planPricingId,
    accountMode,
    billingMode,
    pendingTransition,
    hasSubscription,
    isActive,
    isUnavailable,
    isLoading: subscriptionQuery.isLoading,
    isFetching: subscriptionQuery.isFetching,
    refetch
  }
}

export async function ensureCurrentSubscription() {
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(currentSubscriptionQuery())
}

export function getCachedCurrentSubscription() {
  return queryClient.getQueryData(queryKeys.subscriptions.current())?.data ?? null
}

export function invalidateSubscriptionState() {
  queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all })
}
