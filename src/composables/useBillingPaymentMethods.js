import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { toMilliseconds } from '@/services/v2/base/query/config'

const STALE_TIME = toMilliseconds({ seconds: 60 })
const GC_TIME = toMilliseconds({ minutes: 5 })

export function useBillingPaymentMethods(options = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: queryKeys.serviceOrders.billingPaymentMethods(),
    queryFn: () => serviceOrdersService.getBillingPaymentMethods(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
