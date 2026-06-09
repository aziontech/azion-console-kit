import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export function useBillingPaymentMethods(options = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: queryKeys.serviceOrders.billingPaymentMethods(),
    queryFn: () => serviceOrdersService.getBillingPaymentMethods(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    meta: { persist: false },
    enabled
  })

  const paymentMethods = computed(() => query.data.value?.paymentMethods ?? [])
  const defaultPaymentMethod = computed(() => query.data.value?.defaultPaymentMethod ?? null)
  const hasPaymentMethods = computed(() => paymentMethods.value.length > 0)

  return {
    query,
    paymentMethods,
    defaultPaymentMethod,
    hasPaymentMethods,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}
