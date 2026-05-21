import { useQuery } from '@tanstack/vue-query'
import { accountCurrentService } from '@/services/v2/account/account-current-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { toMilliseconds } from '@/services/v2/base/query/config'

const STALE_TIME = toMilliseconds({ seconds: 30 })
const GC_TIME = toMilliseconds({ minutes: 5 })

const buildServiceOrderQuery = () => ({
  queryKey: queryKeys.account.info().concat('service-order'),
  queryFn: () => accountCurrentService.fetchCurrentServiceOrder(),
  staleTime: STALE_TIME,
  gcTime: GC_TIME
})

const buildPlanQuery = () => ({
  queryKey: queryKeys.account.info().concat('plan'),
  queryFn: () => accountCurrentService.fetchCurrentPlan(),
  staleTime: STALE_TIME,
  gcTime: GC_TIME
})

/**
 * Reactive read of the authenticated account's current service order.
 * Source: GET /api/v1/account/service_order. A 404 is normalized to `null`
 * by the service layer; other errors surface via Vue Query's `error`.
 */
export function useCurrentAccountServiceOrder(options = {}) {
  const { enabled = true } = options
  return useQuery({
    ...buildServiceOrderQuery(),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled
  })
}

/**
 * Reactive read of the authenticated account's currently entitled plan.
 * Source: GET /api/v1/account/plan. A 404 is normalized to `null`.
 */
export function useCurrentAccountPlan(options = {}) {
  const { enabled = true } = options
  return useQuery({
    ...buildPlanQuery(),
    refetchOnMount: false,
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
