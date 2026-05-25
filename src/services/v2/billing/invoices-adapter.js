import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

const STRIPE_STATUS_TO_PAYMENT_HISTORY = {
  paid: 'Paid',
  open: 'Pending',
  draft: 'Pending',
  uncollectible: 'NotCharged',
  void: 'NotCharged'
}

export const DEFAULT_STATUS_MAP = {
  Paid: { content: 'Paid', icon: 'pi pi-check-circle', severity: 'success' },
  Pending: { content: 'Pending', icon: 'pi pi-calendar', severity: 'danger' },
  NotCharged: { content: 'Not charged', severity: 'info' }
}

const unixSecondsToMs = (seconds) => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null
  return seconds * 1000
}

const formatAmount = (cents, currency) => {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '---'
  const value = cents / 100
  const safeCurrency = typeof currency === 'string' && currency ? currency.toUpperCase() : 'USD'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: safeCurrency }).format(
      value
    )
  } catch {
    return `${value.toFixed(2)} ${safeCurrency}`
  }
}

export class InvoicesAdapter {
  static resolveStatusKey(status) {
    return STRIPE_STATUS_TO_PAYMENT_HISTORY[status] || 'NotCharged'
  }

  static transformInvoiceToRow(invoice, statusMap = DEFAULT_STATUS_MAP) {
    const map = statusMap || DEFAULT_STATUS_MAP
    const number = invoice?.number || null
    const id = invoice?.id || ''
    const downloadUrl = invoice?.invoice_pdf || ''
    const detailsUrl = invoice?.hosted_invoice_url || ''
    const isFallback = !number
    const rowId = number || id
    const amountCents =
      typeof invoice?.amount_paid === 'number' ? invoice.amount_paid : invoice?.total

    return {
      id: rowId,
      invoiceNumber: {
        content: number || id,
        id: rowId
      },
      amount: formatAmount(amountCents, invoice?.currency),
      paymentMethod: {
        cardNumber: '',
        cardBrand: '',
        value: ''
      },
      status: map[InvoicesAdapter.resolveStatusKey(invoice?.status)] || map.NotCharged,
      paymentDate: formatDateToDayMonthYearHour(
        unixSecondsToMs(invoice?.period_end ?? invoice?.created)
      ),
      invoiceUrl: downloadUrl,
      detailsUrl,
      disabled: !downloadUrl,
      isFallback
    }
  }

  static transformInvoicesList(invoices, statusMap = DEFAULT_STATUS_MAP) {
    if (!Array.isArray(invoices) || !invoices.length) return []
    return invoices.map((invoice) => InvoicesAdapter.transformInvoiceToRow(invoice, statusMap))
  }
}
