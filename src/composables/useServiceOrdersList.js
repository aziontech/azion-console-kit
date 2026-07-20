import { computed, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'

const NO_CACHE_META = { persist: false }

const buildQueryConfig = (accountId) => ({
  queryKey: queryKeys.serviceOrders.list({ accountId }),
  queryFn: () => serviceOrdersService.listServiceOrders({ accountId }),
  staleTime: 0,
  gcTime: 0,
  meta: NO_CACHE_META
})

const pickActive = (orders) => orders.find((so) => so.status === SO_STATUS.ACTIVE) ?? null
const pickDraft = (orders) => orders.find((so) => so.status === SO_STATUS.DRAFT) ?? null

export function useServiceOrdersList(accountIdRef) {
  const accountId = computed(() => unref(accountIdRef) ?? null)

  const query = useQuery({
    queryKey: computed(() => queryKeys.serviceOrders.list({ accountId: accountId.value })),
    queryFn: () => serviceOrdersService.listServiceOrders({ accountId: accountId.value }),
    enabled: computed(() => Boolean(accountId.value)),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    meta: NO_CACHE_META
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

export async function ensureServiceOrdersList(accountId) {
  if (!accountId) return { data: [] }
  await waitForPersistenceRestore()
  return queryClient.fetchQuery(buildQueryConfig(accountId))
}

export function getCachedOrders(accountId) {
  if (!accountId) return []
  const cached = queryClient.getQueryData(queryKeys.serviceOrders.list({ accountId }))
  return cached?.data ?? []
}

export function getCurrentServiceOrder(accountId) {
  const orders = getCachedOrders(accountId)
  return pickDraft(orders) ?? pickActive(orders)
}

export function getActiveServiceOrder(accountId) {
  return pickActive(getCachedOrders(accountId))
}

export function getDraftServiceOrder(accountId) {
  return pickDraft(getCachedOrders(accountId))
}
