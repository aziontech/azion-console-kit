import { computed, unref } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { subscriptionsService } from '@/services/v2/billing-api/subscriptions/subscriptions-service'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { generateIdempotencyKey } from '@/services/v2/utils/idempotency-key'
import { isNotFound } from '@/services/v2/utils/is-not-found'
import {
  CHANGE_TIMING,
  PRORATION_BEHAVIOR,
  SCHEDULED_CHANGE_STATUS,
  SCHEDULED_CHANGE_TYPE
} from '@/services/v2/billing-api/subscriptions/subscriptions-constants'
import {
  ensureCurrentSubscription,
  getCachedCurrentSubscription,
  invalidateSubscriptionState
} from '@/composables/useSubscriptionState'

const NO_CACHE_META = { persist: false }

const EMPTY_SCHEDULED_CHANGES = { results: [], count: 0, unavailable: true }

export const PLAN_CHANGE_MESSAGES = Object.freeze({
  MISSING_SUBSCRIPTION: 'No active subscription to change.',
  MISSING_PLAN: 'A target plan is required to change the subscription.',
  MISSING_SCHEDULED_CHANGE: 'No scheduled change to cancel.'
})

const assertPlanId = (planId) => {
  if (!planId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_PLAN)
}

const intentKeys = new Map()

const buildIntentId = ({ subscriptionId, planId, planPricingId, period, when }) =>
  `${subscriptionId}:${planId}:${planPricingId ?? ''}:${period ?? ''}:${when ?? ''}`

const takeIdempotencyKey = (intentId) => {
  if (!intentKeys.has(intentId)) intentKeys.set(intentId, generateIdempotencyKey())
  return intentKeys.get(intentId)
}

const releaseIdempotencyKey = (intentId) => intentKeys.delete(intentId)

const fetchScheduledChanges = async (subscriptionId) => {
  try {
    return await subscriptionsService.listScheduledChanges(subscriptionId)
  } catch (error) {
    if (isNotFound(error)) return EMPTY_SCHEDULED_CHANGES
    throw error
  }
}

const buildScheduledChangesQuery = (subscriptionId) => ({
  queryKey: queryKeys.subscriptions.scheduledChanges(subscriptionId),
  queryFn: () => fetchScheduledChanges(subscriptionId),
  staleTime: 0,
  gcTime: 0,
  meta: NO_CACHE_META
})

export const pickPendingChange = (scheduledChanges) => {
  const results = scheduledChanges?.results ?? []
  return (
    results.find(
      (item) =>
        item?.status === SCHEDULED_CHANGE_STATUS.SCHEDULED &&
        item?.type === SCHEDULED_CHANGE_TYPE.CHANGE
    ) ?? null
  )
}

export const pickPendingCancellation = (scheduledChanges) => {
  const results = scheduledChanges?.results ?? []
  return (
    results.find(
      (item) =>
        item?.status === SCHEDULED_CHANGE_STATUS.SCHEDULED &&
        item?.type === SCHEDULED_CHANGE_TYPE.CANCEL
    ) ?? null
  )
}

export function useScheduledChanges(subscriptionIdRef, options = {}) {
  const { enabled = true } = options
  const subscriptionId = computed(() => unref(subscriptionIdRef) ?? null)

  const query = useQuery({
    queryKey: computed(() => queryKeys.subscriptions.scheduledChanges(subscriptionId.value)),
    queryFn: () => fetchScheduledChanges(subscriptionId.value),
    enabled: computed(() => Boolean(subscriptionId.value) && Boolean(unref(enabled))),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    meta: NO_CACHE_META
  })

  const scheduledChanges = computed(() => query.data.value?.results ?? [])
  const pendingChange = computed(() => pickPendingChange(query.data.value))
  const pendingCancellation = computed(() => pickPendingCancellation(query.data.value))

  return {
    query,
    scheduledChanges,
    pendingChange,
    pendingCancellation,
    isDowngradePending: computed(() => Boolean(pendingChange.value)),
    isUnavailable: computed(() => query.data.value?.unavailable === true),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}

export async function ensureScheduledChanges(subscriptionId) {
  if (!subscriptionId) return EMPTY_SCHEDULED_CHANGES
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(buildScheduledChangesQuery(subscriptionId))
}

export async function ensurePendingChange(subscriptionId) {
  return pickPendingChange(await ensureScheduledChanges(subscriptionId))
}

/**
 * Plan lifecycle against billing-api v4.
 *
 * Every nested route — `change`, `change/preview`, `cancel` and
 * `scheduled_changes` — keys on `{subscription_id}`. The id comes from
 * `subscriptions/current` and is resolved here so callers never have to know.
 */
export function useSubscriptionPlanChange() {
  const invalidate = (subscriptionId) => {
    invalidateSubscriptionState()
    if (subscriptionId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.scheduledChanges(subscriptionId)
      })
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.billing.all })
  }

  const resolveSubscriptionId = async (subscriptionId) => {
    if (subscriptionId) return subscriptionId
    const cached = getCachedCurrentSubscription()
    if (cached?.id) return cached.id
    const current = await ensureCurrentSubscription()
    return current?.data?.id ?? null
  }

  const createMutation = useMutation({
    mutationFn: ({ payload, idempotencyKey }) =>
      subscriptionsService.createSubscription({ payload, idempotencyKey })
  })

  const previewMutation = useMutation({
    mutationFn: ({ subscriptionId, payload }) =>
      subscriptionsService.previewSubscriptionChange({ subscriptionId, payload })
  })

  const changeMutation = useMutation({
    mutationFn: ({ subscriptionId, payload, idempotencyKey }) =>
      subscriptionsService.changeSubscription({ subscriptionId, payload, idempotencyKey })
  })

  const cancelSubscriptionMutation = useMutation({
    mutationFn: ({ subscriptionId, payload }) =>
      subscriptionsService.cancelSubscription({ subscriptionId, payload })
  })

  const cancelScheduledChangeMutation = useMutation({
    mutationFn: ({ subscriptionId, scheduledChangeId }) =>
      subscriptionsService.deleteScheduledChange({ subscriptionId, scheduledChangeId })
  })

  const buildPayload = ({ planId, planPricingId, period, prorationBehavior, when }) => ({
    planId,
    ...(planPricingId !== undefined && planPricingId !== null && { planPricingId }),
    ...(period !== undefined && period !== null && { period }),
    prorationBehavior: prorationBehavior ?? PRORATION_BEHAVIOR.CREATE_PRORATIONS,
    when: when ?? CHANGE_TIMING.NOW
  })

  const createSubscription = async ({
    planId,
    planPricingId,
    accountId,
    paymentMethodId,
    tosVersion
  }) => {
    assertPlanId(planId)

    const intentId = `create:${planId}:${planPricingId ?? ''}`
    const response = await createMutation.mutateAsync({
      payload: { planId, planPricingId, accountId, paymentMethodId, tosVersion },
      idempotencyKey: takeIdempotencyKey(intentId)
    })

    releaseIdempotencyKey(intentId)
    invalidate(response?.subscription?.id)
    return response
  }

  const previewChange = async ({
    subscriptionId,
    planId,
    planPricingId,
    period,
    prorationBehavior,
    when
  }) => {
    const targetSubscriptionId = await resolveSubscriptionId(subscriptionId)
    if (!targetSubscriptionId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SUBSCRIPTION)
    assertPlanId(planId)

    return previewMutation.mutateAsync({
      subscriptionId: targetSubscriptionId,
      payload: buildPayload({ planId, planPricingId, period, prorationBehavior, when })
    })
  }

  const applyChange = async ({
    subscriptionId,
    planId,
    planPricingId,
    period,
    prorationBehavior,
    when
  }) => {
    const targetSubscriptionId = await resolveSubscriptionId(subscriptionId)
    if (!targetSubscriptionId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SUBSCRIPTION)
    assertPlanId(planId)

    const payload = buildPayload({ planId, planPricingId, period, prorationBehavior, when })
    const intentId = buildIntentId({
      subscriptionId: targetSubscriptionId,
      planId,
      planPricingId: payload.planPricingId,
      period: payload.period,
      when: payload.when
    })

    const response = await changeMutation.mutateAsync({
      subscriptionId: targetSubscriptionId,
      payload,
      idempotencyKey: takeIdempotencyKey(intentId)
    })

    releaseIdempotencyKey(intentId)
    invalidate(targetSubscriptionId)
    return response
  }

  const cancelSubscription = async ({ subscriptionId, when, reason } = {}) => {
    const targetId = await resolveSubscriptionId(subscriptionId)
    if (!targetId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SUBSCRIPTION)

    const response = await cancelSubscriptionMutation.mutateAsync({
      subscriptionId: targetId,
      payload: { when: when ?? CHANGE_TIMING.PERIOD_END, reason }
    })

    invalidate(targetId)
    return response
  }

  const cancelScheduledChange = async ({ subscriptionId, scheduledChangeId } = {}) => {
    const targetSubscriptionId = await resolveSubscriptionId(subscriptionId)
    if (!targetSubscriptionId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SUBSCRIPTION)

    const targetChangeId =
      scheduledChangeId ?? (await ensurePendingChange(targetSubscriptionId))?.id ?? null
    if (!targetChangeId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SCHEDULED_CHANGE)

    const response = await cancelScheduledChangeMutation.mutateAsync({
      subscriptionId: targetSubscriptionId,
      scheduledChangeId: targetChangeId
    })

    invalidate(targetSubscriptionId)
    return response
  }

  return {
    createSubscription,
    previewChange,
    applyChange,
    cancelSubscription,
    cancelScheduledChange,
    isCreating: computed(() => createMutation.isPending.value),
    isPreviewing: computed(() => previewMutation.isPending.value),
    isChanging: computed(() => changeMutation.isPending.value),
    isCancelling: computed(() => cancelSubscriptionMutation.isPending.value),
    isCancellingScheduledChange: computed(() => cancelScheduledChangeMutation.isPending.value),
    isSubmitting: computed(
      () =>
        createMutation.isPending.value ||
        changeMutation.isPending.value ||
        cancelSubscriptionMutation.isPending.value ||
        cancelScheduledChangeMutation.isPending.value
    )
  }
}
