import { beforeEach, describe, expect, it, vi } from 'vitest'
import { billingInvoicesService } from '@/services/v2/billing-api/invoices/invoices-service'
import { InvoicesAdapter } from '@/services/v2/billing-api/invoices/invoices-adapter'
import { httpService } from '@/services/v2/base/http/httpService'

vi.mock('@/services/v2/base/http/httpService')

describe('InvoicesService.listInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists invoices from /v4/account/billing/invoices with page params', async () => {
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValue({
      data: { count: 1, results: [{ id: 2, amount: 21561, currency: 'usd', status: 'open' }] }
    })

    const result = await billingInvoicesService.listInvoices({ page: 1, pageSize: 50 })

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/v4/account/billing/invoices',
        params: { page: 1, page_size: 50 }
      })
    )
    expect(result.count).toBe(1)
    expect(result.results[0].id).toBe(2)
  })
})

describe('InvoicesService.getInvoicePdf (stage contract 2026-08-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads the async PDF from /{id}/pdf — format=pdf on the detail route is ignored by the API', async () => {
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValue({
      data: { state: 'executed', data: { status: 'generating', pdf_url: null } }
    })

    const result = await billingInvoicesService.getInvoicePdf(2)

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/v4/account/billing/invoices/2/pdf' })
    )
    expect(result.isGenerating).toBe(true)
    expect(result.pdfUrl).toBeNull()
  })

  it('exposes the pdf url once the generation completes', async () => {
    vi.spyOn(httpService, 'request').mockResolvedValue({
      data: { state: 'executed', data: { status: 'ready', pdf_url: 'https://cdn/pdf/2.pdf' } }
    })

    const result = await billingInvoicesService.getInvoicePdf(2)

    expect(result.isGenerating).toBe(false)
    expect(result.pdfUrl).toBe('https://cdn/pdf/2.pdf')
  })
})

describe('InvoicesAdapter.toHistoryRows', () => {
  it('maps a v4 invoice into a payment-history row', () => {
    const [row] = InvoicesAdapter.toHistoryRows(
      [
        {
          id: 2,
          amount: 21561,
          currency: 'usd',
          status: 'open',
          issuedAt: '2026-08-05T12:36:26.000Z',
          pdfUrl: null
        }
      ],
      { formatDate: (value) => `formatted:${value}` }
    )

    expect(row.id).toBe(2)
    expect(row.invoiceId).toBe(2)
    expect(row.amount).toBe('usd 215.61')
    expect(row.status).toEqual(InvoicesAdapter.INVOICE_STATUS_TAGS.open)
    expect(row.paymentDate).toBe('formatted:2026-08-05T12:36:26.000Z')
    expect(row.invoiceUrl).toBeNull()
  })
})
