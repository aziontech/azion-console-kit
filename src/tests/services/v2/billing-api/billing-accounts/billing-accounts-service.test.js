import { describe, expect, it, beforeEach, vi } from 'vitest'
import { BillingAccountsService } from '@/services/v2/billing-api/billing-accounts/billing-accounts-service'

const wireBillingAccount = {
  id: 501,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: null,
  owner_account_id: 900,
  currency: 'USD',
  country: 'US',
  account_type: 'self_serve',
  status: 'active',
  default_payment_method_id: 44
}

const detailEnvelope = { data: { state: 'executed', data: wireBillingAccount } }

describe('BillingAccountsService', () => {
  let service
  let httpMock

  beforeEach(() => {
    service = new BillingAccountsService()
    httpMock = vi.fn().mockResolvedValue(detailEnvelope)
    service.http = { request: httpMock }
  })

  it('lists billing accounts with snake_case filters', async () => {
    httpMock.mockResolvedValue({
      data: {
        count: 0,
        total_pages: 0,
        page: 1,
        page_size: 20,
        next: null,
        previous: null,
        results: []
      }
    })

    await service.listBillingAccounts({ pageSize: 50, account: 900, status: 'active' })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/billing_accounts',
      params: { page_size: 50 }
    })
  })

  it('creates a billing account without owner_account_id and no idempotency header', async () => {
    const result = await service.createBillingAccount({
      ownerAccountId: 900,
      currency: 'USD',
      country: 'US'
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'POST',
      url: '/v4/billing_accounts',
      body: { currency: 'USD', country: 'US' }
    })
    expect(httpMock.mock.calls[0][0].config).toBeUndefined()
    expect(result.data.id).toBe(501)
  })

  it('gets the current billing account', async () => {
    await service.getCurrentBillingAccount()

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/billing_accounts/current'
    })
  })

  it('gets a billing account by id', async () => {
    const result = await service.getBillingAccount(501)

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/billing_accounts/501'
    })
    expect(result.data.id).toBe(501)
    expect(result.data.defaultPaymentMethodId).toBe(44)
  })

  it('updates a billing account with the PATCH-able profile fields', async () => {
    await service.updateBillingAccount({
      id: 501,
      payload: {
        taxId: '12-3456789',
        legalEntityName: 'Acme Inc',
        defaultPaymentMethodId: 44,
        billingEmails: ['billing@acme.com'],
        address: {
          line1: '1 Main St',
          postalCode: '62704'
        }
      }
    })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'PATCH',
      url: '/v4/billing_accounts/501',
      body: {
        tax_id: '12-3456789',
        legal_entity_name: 'Acme Inc'
      }
    })
  })

  it('gets a cost breakdown scoped to a period with amounts as cents', async () => {
    httpMock.mockResolvedValue({
      data: {
        state: 'executed',
        data: {
          account_id: 501,
          period: '2026-07',
          currency: 'USD',
          total: 125000,
          items: [{ consuming_account_id: 12, product_id: 3, amount: 125000 }]
        }
      }
    })

    const result = await service.getCostBreakdown({ id: 501, period: '2026-07' })

    expect(httpMock).toHaveBeenCalledWith({
      method: 'GET',
      url: '/v4/billing_accounts/501/cost_breakdown',
      params: { period: '2026-07' }
    })
    expect(result.data.total).toBe(125000)
    expect(result.data.items[0].amount).toBe(125000)
    expect(result.data.items[0].consumingAccountId).toBe(12)
  })
})
