import { useQuery } from '@tanstack/vue-query'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

const PLANS_QUERY = {
  queryKey: queryKeys.plans.list(),
  queryFn: () => serviceOrdersService.listPlansService(),
  staleTime: 0,
  gcTime: 0,
  meta: { persist: false }
}

/**
 * Composable for fetching the plan catalogue from the server.
 * Cached across the session (staleTime 1h, gcTime 24h, no refetch on
 * mount/focus). Shares `queryKeys.plans.list()` with `ensurePlansList`
 * and `ServiceOrdersService.useListPlansQuery`, so all consumers reuse
 * the same cache entry.
 *
 * @param {Object} [options] - Query options
 * @param {boolean} [options.enabled=true] - Controls automatic query execution
 * @returns {Object} Vue Query result object with data, isLoading, error, etc.
 */
export function usePlansList(options = {}) {
  const { enabled = true } = options

  return useQuery({
    ...PLANS_QUERY,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    enabled
  })
}

/**
 * Imperative, cache-aware loader for the plan catalogue. Returns the
 * cached entry when fresh (within `staleTime`), otherwise fetches once
 * and populates the cache. Concurrent calls dedupe through TanStack
 * Query's in-flight tracking.
 *
 * Prefer this over `usePlansList({ enabled: false }).refetch()` — the
 * `refetch` API always bypasses `staleTime` and forces a network call,
 * which defeats the catalogue cache.
 *
 * @returns {Promise<Array>} The plans list (possibly served from cache).
 */
export async function ensurePlansList() {
  await waitForPersistenceRestore()
  return queryClient.ensureQueryData(PLANS_QUERY)
}

/**
 * Helper to get plan pricing by plan name/sku
 * @param {Array} plans - List of plans from API
 * @param {string} planName - Plan name (pro, hobby)
 * @returns {Object} { monthly: number, yearly: number }
 */
export function getPlanPricing(plans, planName) {
  if (!Array.isArray(plans) || !planName) {
    return { monthly: 0, yearly: 0 }
  }

  const plan = plans.find((item) => item.sku.toLowerCase() === planName.toLowerCase())
  if (!plan?.pricings) {
    return { monthly: 0, yearly: 0 }
  }

  const monthly =
    plan.pricings.find((pricing) => pricing.periodicity === 'monthly')?.priceValue || 0
  const yearly = plan.pricings.find((pricing) => pricing.periodicity === 'yearly')?.priceValue || 0

  return { monthly, yearly }
}

/**
 * Helper to get plan pricing ID by billing cycle
 * @param {Array} plans - List of plans from API
 * @param {string} planName - Plan name (pro, hobby)
 * @param {string} billingCycle - Billing cycle (monthly, yearly)
 * @returns {string|null} planPricingId
 */
export function getPlanPricingId(plans, planName, billingCycle) {
  if (!Array.isArray(plans) || !planName || !billingCycle) {
    return null
  }

  const plan = plans.find((item) => item.sku.toLowerCase() === planName.toLowerCase())
  if (!plan?.pricings) return null

  const pricing = plan.pricings.find((pricingItem) => pricingItem.periodicity === billingCycle)
  return pricing?.id || null
}
