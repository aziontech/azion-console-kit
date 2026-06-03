import { useQuery } from '@tanstack/vue-query'
import { accountCurrentService } from '@/services/v2/account/account-current-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

const NO_CACHE_META = { persist: false }

const buildServiceOrderQuery = () => ({
  queryKey: queryKeys.account.info().concat('service-order'),
  queryFn: () => accountCurrentService.fetchCurrentServiceOrder(),
  staleTime: 0,
  gcTime: 0,
  meta: NO_CACHE_META
})

const buildPlanQuery = () => ({
  queryKey: queryKeys.account.info().concat('plan'),
  queryFn: () => accountCurrentService.fetchCurrentPlan(),
  staleTime: 0,
  gcTime: 0,
  meta: NO_CACHE_META
})

/**
 * Reactive read of the authenticated account's current service order.
 * Source: GET /v4/service_orders/current. A 404 is normalized to `null`
 * by the service layer; other errors surface via Vue Query's `error`.
 */
export function useCurrentAccountServiceOrder(options = {}) {
  const { enabled = true } = options
  return useQuery({
    ...buildServiceOrderQuery(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    enabled
  })
}

/**
 * Reactive read of the authenticated account's currently entitled plan.
 * Source: GET /v4/service_orders/plans/current. A 404 is normalized to `null`.
 */
export function useCurrentAccountPlan(options = {}) {
  const { enabled = true } = options
  return useQuery({
    ...buildPlanQuery(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    enabled
  })
}

export async function ensureCurrentAccountServiceOrder() {
  await waitForPersistenceRestore()
  return queryClient.ensureQueryData(buildServiceOrderQuery())
}

export async function ensureCurrentAccountPlan() {
  await waitForPersistenceRestore()
  return queryClient.ensureQueryData(buildPlanQuery())
}

export function invalidateCurrentAccountSubscription() {
  queryClient.invalidateQueries({ queryKey: buildServiceOrderQuery().queryKey })
  queryClient.invalidateQueries({ queryKey: buildPlanQuery().queryKey })
}
