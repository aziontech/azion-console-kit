// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest'
// NOTE (real finding, test-maturity fase 2): billing-service.js exports a class
// named `PaymentService` — a copy-paste slip. It is the BILLING invoices
// service (v4/billing/invoices) and collides by name with the real
// PaymentService in services/v2/payment. Renaming is a team decision (breaks
// imports); the tests pin the CURRENT public behavior.
import { PaymentService as BillingInvoicesService } from '@/services/v2/billing/billing-service'
import { spyHttpRequest } from '../../../support/versioning/boundaries'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listInvoices', () => {
  it('GETs v4/billing/invoices with params and returns the raw results', async () => {
    const http = spyHttpRequest()
    http.respondWith({ results: [{ invoice: 'INV-2026-07', total: '12.34' }] })

    const rows = await new BillingInvoicesService().listInvoices({ pageSize: 20 })

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'GET',
      url: 'v4/billing/invoices',
      params: { pageSize: 20 }
    })
    expect(rows).toEqual([{ invoice: 'INV-2026-07', total: '12.34' }])
  })

  it('defaults to pageSize 100', async () => {
    const http = spyHttpRequest()
    http.respondWith({ results: [] })

    await new BillingInvoicesService().listInvoices()

    expect(http.spy.mock.calls.at(-1)[0].params).toEqual({ pageSize: 100 })
  })
})
