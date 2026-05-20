import { computed, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { toMilliseconds } from '@/services/v2/base/query/config'
import { SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'

const STALE_TIME = toMilliseconds({ seconds: 60 })
const GC_TIME = toMilliseconds({ minutes: 5 })
const ENTITLED_STATUSES = new Set([SO_STATUS.ACTIVE, SO_STATUS.PAST_DUE, SO_STATUS.BLOCKED])

const buildQueryConfig = (accountId) => ({
  queryKey: queryKeys.serviceOrders.list({ accountId }),
  queryFn: () => serviceOrdersService.listServiceOrders({ accountId }),
  staleTime: STALE_TIME,
  gcTime: GC_TIME
})

const buildCurrentQueryConfig = (accountId) => ({
  queryKey: queryKeys.serviceOrders.current({ accountId }),
  queryFn: () => serviceOrdersService.getCurrentAccountServiceOrder(),
  staleTime: STALE_TIME,
  gcTime: GC_TIME
})

const buildCurrentPlanQueryConfig = (accountId) => ({
  queryKey: queryKeys.serviceOrders.currentPlan({ accountId }),
  queryFn: () => serviceOrdersService.getCurrentAccountPlan(),
  staleTime: STALE_TIME,
  gcTime: GC_TIME
})

const pickActive = (orders) => orders.find((so) => ENTITLED_STATUSES.has(so.status)) ?? null
const pickDraft = (orders) => orders.find((so) => so.status === SO_STATUS.DRAFT) ?? null
const asListResponse = (serviceOrder) => ({ data: serviceOrder ? [serviceOrder] : [] })

export function useServiceOrdersList(accountIdRef) {
  const accountId = computed(() => unref(accountIdRef) ?? null)

  const query = useQuery({
    queryKey: computed(() => queryKeys.serviceOrders.list({ accountId: accountId.value })),
    queryFn: () => serviceOrdersService.listServiceOrders({ accountId: accountId.value }),
    enabled: computed(() => Boolean(accountId.value)),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  const orders = computed(() => query.data.value?.data ?? [])
  const activeServiceOrder = computed(() => pickActive(orders.value))
  const draftServiceOrder = computed(() => pickDraft(orders.value))
  const currentServiceOrder = computed(() => draftServiceOrder.value ?? activeServiceOrder.value)

  return {
    query,
    orders,
    activeServiceOrder,
    draftServiceOrder,
    currentServiceOrder,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}

export function useCurrentAccountServiceOrder(accountIdRef) {
  const accountId = computed(() => unref(accountIdRef) ?? null)

  const query = useQuery({
    queryKey: computed(() => queryKeys.serviceOrders.current({ accountId: accountId.value })),
    queryFn: () => serviceOrdersService.getCurrentAccountServiceOrder(),
    enabled: computed(() => Boolean(accountId.value)),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  const serviceOrder = computed(() => query.data.value?.data ?? null)
  const activeServiceOrder = computed(() =>
    ENTITLED_STATUSES.has(serviceOrder.value?.status) ? serviceOrder.value : null
  )
  const draftServiceOrder = computed(() =>
    serviceOrder.value?.status === SO_STATUS.DRAFT ? serviceOrder.value : null
  )

  return {
    query,
    serviceOrder,
    activeServiceOrder,
    draftServiceOrder,
    currentServiceOrder: serviceOrder,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}

export function useCurrentAccountPlan(accountIdRef) {
  const accountId = computed(() => unref(accountIdRef) ?? null)

  const query = useQuery({
    queryKey: computed(() => queryKeys.serviceOrders.currentPlan({ accountId: accountId.value })),
    queryFn: () => serviceOrdersService.getCurrentAccountPlan(),
    enabled: computed(() => Boolean(accountId.value)),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  return {
    query,
    plan: computed(() => query.data.value?.data ?? null),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}

export async function ensureServiceOrdersList(accountId) {
  if (!accountId) return { data: [] }
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(buildQueryConfig(accountId))
}

export async function ensureCurrentAccountServiceOrder(accountId) {
  if (!accountId) return { data: null }
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(buildCurrentQueryConfig(accountId))
}

export async function ensureCurrentAccountPlan(accountId) {
  if (!accountId) return { data: null }
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(buildCurrentPlanQueryConfig(accountId))
}

export function getCachedOrders(accountId) {
  if (!accountId) return []
  const cached = queryClient.getQueryData(queryKeys.serviceOrders.list({ accountId }))
  if (cached?.data) return cached.data

  const current = queryClient.getQueryData(queryKeys.serviceOrders.current({ accountId }))?.data
  return asListResponse(current).data
}

export function getCurrentServiceOrder(accountId) {
  const current = queryClient.getQueryData(queryKeys.serviceOrders.current({ accountId }))?.data
  if (current) return current

  const orders = getCachedOrders(accountId)
  return pickDraft(orders) ?? pickActive(orders)
}

export function getActiveServiceOrder(accountId) {
  return pickActive(getCachedOrders(accountId))
}

export function getDraftServiceOrder(accountId) {
  return pickDraft(getCachedOrders(accountId))
}
