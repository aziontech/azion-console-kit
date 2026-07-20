import { listPaymentHistoryService } from './list-payment-history-service'
import { invoicesService } from '@/services/v2/billing/invoices-service'

const toLegacyRows = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.body)) return value.body
  return []
}

const fetchLegacyRows = async (params) => {
  try {
    const result = await listPaymentHistoryService(params)
    return toLegacyRows(result)
  } catch {
    return []
  }
}

const fetchInvoicesRows = async () => {
  try {
    const { rows } = await invoicesService.listAccountInvoicesAsRows()
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

const parsePaymentDate = (value) => {
  if (!value) return 0
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) {
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    return new Date(year, month - 1, day).getTime()
  }
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

const mergeRows = (legacyRows, invoicesRows) => {
  const byInvoiceNumber = new Map()
  const fallbackRows = []

  for (const row of invoicesRows) {
    const key = row?.invoiceNumber?.content
    if (key) {
      byInvoiceNumber.set(String(key), row)
    } else {
      fallbackRows.push(row)
    }
  }

  for (const row of legacyRows) {
    const key = row?.invoiceNumber?.content
    if (!key) {
      fallbackRows.push(row)
      continue
    }
    if (!byInvoiceNumber.has(String(key))) {
      byInvoiceNumber.set(String(key), row)
    }
  }

  const merged = [...byInvoiceNumber.values(), ...fallbackRows]
  return merged.sort(
    (left, right) => parsePaymentDate(right.paymentDate) - parsePaymentDate(left.paymentDate)
  )
}

export const listPaymentHistoryWithInvoicesService = async (params = {}) => {
  const [legacySettled, invoicesSettled] = await Promise.allSettled([
    fetchLegacyRows(params),
    fetchInvoicesRows()
  ])
  const legacyRows = legacySettled.status === 'fulfilled' ? legacySettled.value : []
  const invoicesRows = invoicesSettled.status === 'fulfilled' ? invoicesSettled.value : []
  return mergeRows(legacyRows, invoicesRows)
}
