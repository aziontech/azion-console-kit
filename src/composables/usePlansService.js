import { useQuery, useMutation } from '@tanstack/vue-query'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

/**
 * Composable for fetching plans list from server
 * @param {Object} [options] - Query options
 * @param {boolean} [options.enabled=true] - Controls automatic query execution
 * @returns {Object} Vue Query result object with data, isLoading, error, etc.
 */
export function usePlansList(options = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: queryKeys.plans.list(),
    queryFn: () => serviceOrdersService.listPlansService(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  })
}

/**
 * Composable for validating coupon codes
 * @returns {Object} Vue Query mutation object with mutate, isPending, etc.
 */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, planId }) => serviceOrdersService.validateCouponService({ code, planId })
  })
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
