import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { invoicesService } from '@/services/v2/billing/invoices-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { toMilliseconds } from '@/services/v2/base/query/config'

const STALE_TIME = toMilliseconds({ seconds: 60 })
const GC_TIME = toMilliseconds({ minutes: 5 })

export function useLatestInvoice(options = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: queryKeys.billing.invoicesList(),
    queryFn: () => invoicesService.listAccountInvoices({ limit: 1 }),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled
  })

  const latestInvoice = computed(() => query.data.value?.invoices?.[0] ?? null)

  const latestInvoiceTotal = computed(() => {
    const invoice = latestInvoice.value
    if (!invoice) return null
    const cents = typeof invoice.amount_paid === 'number' ? invoice.amount_paid : invoice.total
    if (typeof cents !== 'number' || !Number.isFinite(cents)) return null
    return cents / 100
  })

  return {
    query,
    latestInvoice,
    latestInvoiceTotal,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}
