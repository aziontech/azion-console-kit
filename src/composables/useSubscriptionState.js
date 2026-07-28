import { computed, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { subscriptionsService } from '@/services/v2/billing-api/subscriptions/subscriptions-service'
import { SubscriptionsAdapter } from '@/services/v2/billing-api/subscriptions/subscriptions-adapter'
import { SUBSCRIPTION_ENTITLED_STATUSES } from '@/services/v2/billing-api/subscriptions/subscriptions-constants'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { isNotFound } from '@/services/v2/utils/is-not-found'

const NO_CACHE_META = { persist: false }

const NO_SUBSCRIPTION = { data: null }
const UNAVAILABLE = { data: null, unavailable: true }
const EMPTY_VERSIONS = { results: [] }

const fetchCurrentSubscription = async () => {
  try {
    return await subscriptionsService.getCurrentSubscription()
  } catch (error) {
    if (isNotFound(error)) return NO_SUBSCRIPTION
    if (error?.status === 409 || error?.statusCode === 409) return UNAVAILABLE
    throw error
  }
}

const fetchSubscriptionVersions = async (subscriptionId) => {
  try {
    return await subscriptionsService.listSubscriptionVersions(subscriptionId)
  } catch (error) {
    if (isNotFound(error)) return EMPTY_VERSIONS
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

const versionsQuery = (subscriptionId) => ({
  queryKey: queryKeys.subscriptions.versions(subscriptionId),
  queryFn: () => fetchSubscriptionVersions(subscriptionId),
  staleTime: 0,
  gcTime: 0,
  meta: NO_CACHE_META
})

export const isEntitled = (subscription) =>
  SUBSCRIPTION_ENTITLED_STATUSES.includes(subscription?.status)

/**
 * Current subscription plus the effective version behind it.
 *
 * The v4 `Subscription` payload carries lifecycle only — `plan_id`, `period`
 * and the fee snapshot live on `SubscriptionVersion`, so the plan identity
 * needs both reads. `service_order_id` comes from the subscription and is the
 * id the change/scheduled_changes routes key on.
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
  const serviceOrderId = computed(() => subscription.value?.serviceOrderId ?? null)

  const versionsQueryResult = useQuery({
    queryKey: computed(() => queryKeys.subscriptions.versions(subscriptionId.value)),
    queryFn: () => fetchSubscriptionVersions(subscriptionId.value),
    enabled: computed(() => Boolean(subscriptionId.value) && Boolean(unref(enabled))),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    meta: NO_CACHE_META
  })

  const versions = computed(() => versionsQueryResult.data.value?.results ?? [])
  const currentVersion = computed(() => SubscriptionsAdapter.pickCurrentVersion(versions.value))

  const hasSubscription = computed(() => Boolean(subscription.value))
  const isActive = computed(() => isEntitled(subscription.value))

  const refetch = async () => {
    await subscriptionQuery.refetch()
    if (subscriptionId.value) await versionsQueryResult.refetch()
  }

  return {
    subscriptionQuery,
    versionsQuery: versionsQueryResult,
    subscription,
    subscriptionId,
    serviceOrderId,
    versions,
    currentVersion,
    hasSubscription,
    isActive,
    isUnavailable,
    isLoading: computed(
      () => subscriptionQuery.isLoading.value || versionsQueryResult.isLoading.value
    ),
    isFetching: computed(
      () => subscriptionQuery.isFetching.value || versionsQueryResult.isFetching.value
    ),
    refetch
  }
}

export async function ensureCurrentSubscription() {
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(currentSubscriptionQuery())
}

export async function ensureSubscriptionVersions(subscriptionId) {
  if (!subscriptionId) return EMPTY_VERSIONS
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(versionsQuery(subscriptionId))
}

export function getCachedCurrentSubscription() {
  return queryClient.getQueryData(queryKeys.subscriptions.current())?.data ?? null
}

export function invalidateSubscriptionState() {
  queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all })
}
