import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { paymentService } from '@/services/v2/payment/payment-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const ensurePaymentMethodsKey = () =>
  queryKeys.payment?.list?.() ?? ['payment', 'credit-cards', 'list']

export function usePaymentMethods(options = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: ensurePaymentMethodsKey(),
    queryFn: () => paymentService.listCreditCards(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    meta: { persist: false },
    enabled
  })

  const cards = computed(() => query.data.value?.body ?? [])
  const defaultCard = computed(() => cards.value.find((card) => card?.isDefault) ?? null)
  const hasCards = computed(() => cards.value.length > 0)

  return {
    query,
    cards,
    defaultCard,
    hasCards,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}
