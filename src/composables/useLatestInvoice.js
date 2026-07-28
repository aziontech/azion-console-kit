import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { billingInvoicesService } from '@/services/v2/billing-api/invoices/invoices-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { isNotFound } from '@/services/v2/utils/is-not-found'

const LATEST_PARAMS = { page: 1, pageSize: 1 }

const UNAVAILABLE = { results: [], count: 0, unavailable: true }

const fetchLatestInvoice = async () => {
  try {
    return await billingInvoicesService.listInvoices(LATEST_PARAMS)
  } catch (error) {
    if (isNotFound(error)) return UNAVAILABLE
    throw error
  }
}

export function useLatestInvoice(options = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: queryKeys.billing.invoicesList(LATEST_PARAMS),
    queryFn: () => fetchLatestInvoice(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    meta: { persist: false },
    enabled
  })

  const latestInvoice = computed(() => query.data.value?.results?.[0] ?? null)
  const isUnavailable = computed(() => query.data.value?.unavailable === true)

  const latestInvoiceTotal = computed(() => {
    const cents = latestInvoice.value?.amount
    if (typeof cents !== 'number' || !Number.isFinite(cents)) return null
    return cents / 100
  })

  return {
    query,
    latestInvoice,
    latestInvoiceTotal,
    isUnavailable,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}
