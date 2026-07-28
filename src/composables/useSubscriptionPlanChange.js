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

const intentKeys = new Map()

const buildIntentId = ({ serviceOrderId, planId, period, when }) =>
  `${serviceOrderId}:${planId}:${period ?? ''}:${when ?? ''}`

const takeIdempotencyKey = (intentId) => {
  if (!intentKeys.has(intentId)) intentKeys.set(intentId, generateIdempotencyKey())
  return intentKeys.get(intentId)
}

const releaseIdempotencyKey = (intentId) => intentKeys.delete(intentId)

const fetchScheduledChanges = async (serviceOrderId) => {
  try {
    return await subscriptionsService.listScheduledChanges(serviceOrderId)
  } catch (error) {
    if (isNotFound(error)) return EMPTY_SCHEDULED_CHANGES
    throw error
  }
}

const buildScheduledChangesQuery = (serviceOrderId) => ({
  queryKey: queryKeys.subscriptions.scheduledChanges(serviceOrderId),
  queryFn: () => fetchScheduledChanges(serviceOrderId),
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

export function useScheduledChanges(serviceOrderIdRef, options = {}) {
  const { enabled = true } = options
  const serviceOrderId = computed(() => unref(serviceOrderIdRef) ?? null)

  const query = useQuery({
    queryKey: computed(() => queryKeys.subscriptions.scheduledChanges(serviceOrderId.value)),
    queryFn: () => fetchScheduledChanges(serviceOrderId.value),
    enabled: computed(() => Boolean(serviceOrderId.value) && Boolean(unref(enabled))),
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

export async function ensureScheduledChanges(serviceOrderId) {
  if (!serviceOrderId) return EMPTY_SCHEDULED_CHANGES
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(buildScheduledChangesQuery(serviceOrderId))
}

export async function ensurePendingChange(serviceOrderId) {
  return pickPendingChange(await ensureScheduledChanges(serviceOrderId))
}

/**
 * Plan lifecycle against billing-api v4.
 *
 * The change and scheduled_changes routes key on the subscription's
 * `service_order_id`, not on the subscription id — the id is read from
 * `subscriptions/current` and resolved here so callers never have to know.
 */
export function useSubscriptionPlanChange() {
  const invalidate = (serviceOrderId) => {
    invalidateSubscriptionState()
    if (serviceOrderId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.scheduledChanges(serviceOrderId)
      })
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.billing.all })
  }

  const resolveServiceOrderId = async (serviceOrderId) => {
    if (serviceOrderId) return serviceOrderId
    const cached = getCachedCurrentSubscription()
    if (cached?.serviceOrderId) return cached.serviceOrderId
    const current = await ensureCurrentSubscription()
    return current?.data?.serviceOrderId ?? null
  }

  const createMutation = useMutation({
    mutationFn: ({ payload, idempotencyKey }) =>
      subscriptionsService.createSubscription({ payload, idempotencyKey })
  })

  const previewMutation = useMutation({
    mutationFn: ({ serviceOrderId, payload }) =>
      subscriptionsService.previewSubscriptionChange({ serviceOrderId, payload })
  })

  const changeMutation = useMutation({
    mutationFn: ({ serviceOrderId, payload, idempotencyKey }) =>
      subscriptionsService.changeSubscription({ serviceOrderId, payload, idempotencyKey })
  })

  const cancelSubscriptionMutation = useMutation({
    mutationFn: ({ subscriptionId, payload, idempotencyKey }) =>
      subscriptionsService.cancelSubscription({ subscriptionId, payload, idempotencyKey })
  })

  const cancelScheduledChangeMutation = useMutation({
    mutationFn: ({ serviceOrderId, scheduledChangeId }) =>
      subscriptionsService.deleteScheduledChange({ serviceOrderId, scheduledChangeId })
  })

  const buildPayload = ({ planId, period, prorationBehavior, when }) => ({
    planId,
    ...(period !== undefined && period !== null && { period }),
    prorationBehavior: prorationBehavior ?? PRORATION_BEHAVIOR.CREATE_PRORATIONS,
    when: when ?? CHANGE_TIMING.NOW
  })

  const createSubscription = async ({ planId, period, paymentMethodId, tosVersion }) => {
    if (!planId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_PLAN)

    const response = await createMutation.mutateAsync({
      payload: { planId, period, paymentMethodId, tosVersion },
      idempotencyKey: takeIdempotencyKey(`create:${planId}:${period ?? ''}`)
    })

    releaseIdempotencyKey(`create:${planId}:${period ?? ''}`)
    invalidate(response?.subscription?.serviceOrderId)
    return response
  }

  const previewChange = async ({ serviceOrderId, planId, period, prorationBehavior, when }) => {
    const targetServiceOrderId = await resolveServiceOrderId(serviceOrderId)
    if (!targetServiceOrderId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SUBSCRIPTION)
    if (!planId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_PLAN)

    return previewMutation.mutateAsync({
      serviceOrderId: targetServiceOrderId,
      payload: buildPayload({ planId, period, prorationBehavior, when })
    })
  }

  const applyChange = async ({ serviceOrderId, planId, period, prorationBehavior, when }) => {
    const targetServiceOrderId = await resolveServiceOrderId(serviceOrderId)
    if (!targetServiceOrderId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SUBSCRIPTION)
    if (!planId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_PLAN)

    const payload = buildPayload({ planId, period, prorationBehavior, when })
    const intentId = buildIntentId({
      serviceOrderId: targetServiceOrderId,
      planId,
      period: payload.period,
      when: payload.when
    })

    const response = await changeMutation.mutateAsync({
      serviceOrderId: targetServiceOrderId,
      payload,
      idempotencyKey: takeIdempotencyKey(intentId)
    })

    releaseIdempotencyKey(intentId)
    invalidate(targetServiceOrderId)
    return response
  }

  const cancelSubscription = async ({ subscriptionId, when, reason } = {}) => {
    const targetId = subscriptionId ?? getCachedCurrentSubscription()?.id ?? null
    if (!targetId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SUBSCRIPTION)

    const intentId = `cancel:${targetId}:${when ?? CHANGE_TIMING.PERIOD_END}`
    const response = await cancelSubscriptionMutation.mutateAsync({
      subscriptionId: targetId,
      payload: { when: when ?? CHANGE_TIMING.PERIOD_END, reason },
      idempotencyKey: takeIdempotencyKey(intentId)
    })

    releaseIdempotencyKey(intentId)
    invalidate(response?.data?.serviceOrderId)
    return response
  }

  const cancelScheduledChange = async ({ serviceOrderId, scheduledChangeId } = {}) => {
    const targetServiceOrderId = await resolveServiceOrderId(serviceOrderId)
    if (!targetServiceOrderId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SUBSCRIPTION)

    const targetChangeId =
      scheduledChangeId ?? (await ensurePendingChange(targetServiceOrderId))?.id ?? null
    if (!targetChangeId) throw new Error(PLAN_CHANGE_MESSAGES.MISSING_SCHEDULED_CHANGE)

    const response = await cancelScheduledChangeMutation.mutateAsync({
      serviceOrderId: targetServiceOrderId,
      scheduledChangeId: targetChangeId
    })

    invalidate(targetServiceOrderId)
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
