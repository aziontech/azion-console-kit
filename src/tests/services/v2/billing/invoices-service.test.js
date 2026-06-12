import { describe, expect, it, beforeEach, vi } from 'vitest'
import { InvoicesService } from '@/services/v2/billing/invoices-service'

const v4InvoiceA = {
  id: 'in_aaa',
  number: 'INV-001',
  status: 'paid',
  currency: 'USD',
  amount_paid: 9900,
  amount_due: 0,
  total: 9900,
  created: 1719792000,
  period_start: 1717114800,
  period_end: 1719793199,
  hosted_invoice_url: 'https://stripe/host/aaa',
  invoice_pdf: 'https://stripe/pdf/aaa'
}

const v4InvoiceB = { ...v4InvoiceA, id: 'in_bbb', number: 'INV-002' }

const buildResponse = (overrides = {}) => ({
  data: {
    object: 'list',
    data: [v4InvoiceA, v4InvoiceB],
    has_more: false,
    next_starting_after: null,
    stale: false,
    ...overrides
  }
})

describe('InvoicesService.listAccountInvoices', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new InvoicesService()
    httpMock = vi.fn().mockResolvedValue(buildResponse())
    service.http = { request: httpMock }
  })

  it('hits the v4 nested billing/invoices endpoint with default max limit', async () => {
    await service.listAccountInvoices()
    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/edge_api/v4/service_orders/billing/invoices',
      params: { limit: 100 }
    })
  })

  it('passes starting_after when provided (keyset pagination)', async () => {
    await service.listAccountInvoices({ limit: 12, startingAfter: 'in_cursor' })
    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/edge_api/v4/service_orders/billing/invoices',
      params: { limit: 12, starting_after: 'in_cursor' }
    })
  })

  it('unwraps the v4 envelope { data, has_more, next_starting_after, stale }', async () => {
    httpMock.mockResolvedValue(
      buildResponse({ has_more: true, next_starting_after: 'in_next', stale: true })
    )
    const result = await service.listAccountInvoices()
    expect(result.invoices).toHaveLength(2)
    expect(result.invoices[0].id).toBe('in_aaa')
    expect(result.hasMore).toBe(true)
    expect(result.nextStartingAfter).toBe('in_next')
    expect(result.stale).toBe(true)
  })

  it('returns safe defaults when response body is empty', async () => {
    httpMock.mockResolvedValue({ data: {} })
    const result = await service.listAccountInvoices()
    expect(result).toEqual({
      invoices: [],
      hasMore: false,
      nextStartingAfter: null,
      stale: false
    })
  })
})

describe('InvoicesService.listAccountInvoicesAsRows', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new InvoicesService()
    httpMock = vi.fn().mockResolvedValue(buildResponse())
    service.http = { request: httpMock }
  })

  it('returns transformed rows with pagination metadata', async () => {
    const result = await service.listAccountInvoicesAsRows()
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].invoiceNumber.content).toBe('INV-001')
    expect(result.hasMore).toBe(false)
    expect(result.stale).toBe(false)
  })
})
