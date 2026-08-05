import { computed, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { subscriptionsService } from '@/services/v2/billing-api/subscriptions/subscriptions-service'
import { isEntitledStatus } from '@/services/v2/billing-api/subscriptions/subscriptions-constants'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { isNotFound } from '@/services/v2/utils/is-not-found'
import { isNotImplemented } from '@/services/v2/utils/is-not-implemented'

const NO_CACHE_META = { persist: false }

const NO_SUBSCRIPTION = { data: null }

const SUBSCRIPTION_STALE_TIME = 15_000

export const UNAVAILABLE_REASON = Object.freeze({
  AMBIGUOUS_CONTEXT: 'ambiguous_context',
  NOT_IMPLEMENTED: 'not_implemented'
})

const unavailable = (reason) => ({ data: null, unavailable: true, reason })

const isConflict = (error) => error?.status === 409 || error?.statusCode === 409

const fetchCurrentSubscription = async () => {
  try {
    return await subscriptionsService.getCurrentSubscription()
  } catch (error) {
    if (isNotFound(error)) return NO_SUBSCRIPTION
    if (isConflict(error)) return unavailable(UNAVAILABLE_REASON.AMBIGUOUS_CONTEXT)
    if (isNotImplemented(error)) return unavailable(UNAVAILABLE_REASON.NOT_IMPLEMENTED)
    throw error
  }
}

const currentSubscriptionQuery = () => ({
  queryKey: queryKeys.subscriptions.current(),
  queryFn: fetchCurrentSubscription,
  staleTime: SUBSCRIPTION_STALE_TIME,
  gcTime: SUBSCRIPTION_STALE_TIME,
  meta: NO_CACHE_META
})

export const isEntitled = (subscription) => isEntitledStatus(subscription?.status)

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
    refetchOnMount: true,
    refetchOnWindowFocus: false
  })

  const subscription = computed(() => subscriptionQuery.data.value?.data ?? null)
  const isUnavailable = computed(() => subscriptionQuery.data.value?.unavailable === true)
  const unavailableReason = computed(() => subscriptionQuery.data.value?.reason ?? null)
  const isAmbiguousContext = computed(
    () => unavailableReason.value === UNAVAILABLE_REASON.AMBIGUOUS_CONTEXT
  )
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
    unavailableReason,
    isAmbiguousContext,
    isLoading: subscriptionQuery.isLoading,
    isFetching: subscriptionQuery.isFetching,
    refetch
  }
}

export async function ensureCurrentSubscription({ fresh = false } = {}) {
  await waitForPersistenceRestore()
  return queryClient.fetchQuery({
    ...currentSubscriptionQuery(),
    ...(fresh && { staleTime: 0 })
  })
}

export async function waitForActiveSubscription({ attempts = 4, delayMs = 1200 } = {}) {
  let current = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    current = await ensureCurrentSubscription({ fresh: true })
    if (isEntitled(current?.data)) return current.data
    if (current?.unavailable === true) return null
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return null
}

export function getCachedCurrentSubscription() {
  return queryClient.getQueryData(queryKeys.subscriptions.current())?.data ?? null
}

export function invalidateSubscriptionState() {
  queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all })
}
