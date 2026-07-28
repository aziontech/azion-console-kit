import { describe, expect, it } from 'vitest'
import { BillingAccountsAdapter } from '@/services/v2/billing-api/billing-accounts/billing-accounts-adapter'
import {
  BILLING_ACCOUNT_STATUS,
  BILLING_ACCOUNT_TYPE
} from '@/services/v2/billing-api/billing-accounts/billing-accounts-constants'

const wireBillingAccount = {
  id: 501,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: 'user@azion.com',
  owner_account_id: 900,
  currency: 'USD',
  country: 'US',
  tax_id: '12-3456789',
  account_type: 'invoiced',
  legal_entity_name: 'Acme Inc',
  status: 'active',
  gateway_customer_ref: 'cus_123',
  default_payment_method_id: 44
}

const wireListEnvelope = {
  count: 1,
  total_pages: 1,
  page: 1,
  page_size: 20,
  next: null,
  previous: null,
  results: [wireBillingAccount]
}

describe('billing-accounts constants', () => {
  it('freezes the enum maps with the exact contract spellings', () => {
    expect(BILLING_ACCOUNT_STATUS).toEqual({
      ACTIVE: 'active',
      SUSPENDED: 'suspended',
      CLOSED: 'closed'
    })
    expect(BILLING_ACCOUNT_TYPE).toEqual({
      SELF_SERVE: 'self_serve',
      INVOICED: 'invoiced'
    })
    expect(Object.isFrozen(BILLING_ACCOUNT_STATUS)).toBe(true)
    expect(Object.isFrozen(BILLING_ACCOUNT_TYPE)).toBe(true)
  })
})

describe('BillingAccountsAdapter.transformBillingAccount', () => {
  it('maps snake_case wire fields to camelCase', () => {
    const result = BillingAccountsAdapter.transformBillingAccount(wireBillingAccount)

    expect(result).toEqual({
      id: 501,
      ownerAccountId: 900,
      currency: 'USD',
      country: 'US',
      taxId: '12-3456789',
      accountType: 'invoiced',
      legalEntityName: 'Acme Inc',
      status: 'active',
      gatewayCustomerRef: 'cus_123',
      defaultPaymentMethodId: 44,
      audit: {
        createdAt: '2026-07-01T00:00:00Z',
        lastModified: '2026-07-10T00:00:00Z',
        lastEditor: 'user@azion.com'
      }
    })
  })

  it('defaults nullable fields when absent', () => {
    const result = BillingAccountsAdapter.transformBillingAccount({
      id: 1,
      owner_account_id: 900,
      currency: 'BRL',
      country: 'BR',
      account_type: 'self_serve',
      status: 'suspended',
      created_at: '2026-07-01T00:00:00Z',
      last_modified: '2026-07-01T00:00:00Z'
    })

    expect(result.taxId).toBeNull()
    expect(result.legalEntityName).toBeNull()
    expect(result.gatewayCustomerRef).toBeNull()
    expect(result.defaultPaymentMethodId).toBeNull()
    expect(result.audit.lastEditor).toBeNull()
  })
})

describe('BillingAccountsAdapter.transformCostBreakdown', () => {
  it('keeps totals and item amounts as integer cents', () => {
    const result = BillingAccountsAdapter.transformCostBreakdown({
      account_id: 501,
      period: '2026-07',
      currency: 'USD',
      total: 125000,
      items: [
        { consuming_account_id: 12, product_id: 3, amount: 100000 },
        { consuming_account_id: 13, amount: 25000 }
      ]
    })

    expect(result.total).toBe(125000)
    expect(result.items).toEqual([
      { consumingAccountId: 12, productId: 3, amount: 100000 },
      { consumingAccountId: 13, productId: null, amount: 25000 }
    ])
  })

  it('defaults items to an empty array when missing', () => {
    const result = BillingAccountsAdapter.transformCostBreakdown({
      account_id: 501,
      period: '2026-07',
      currency: 'USD',
      total: 0
    })

    expect(result.items).toEqual([])
  })
})

describe('BillingAccountsAdapter.transformListResponse', () => {
  it('maps the v4 paginated envelope', () => {
    const result = BillingAccountsAdapter.transformListResponse(wireListEnvelope)

    expect(result.count).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.next).toBeNull()
    expect(result.previous).toBeNull()
    expect(result.results).toHaveLength(1)
    expect(result.results[0].id).toBe(501)
    expect(result.results[0].ownerAccountId).toBe(900)
  })

  it('returns an empty list for a malformed envelope', () => {
    const result = BillingAccountsAdapter.transformListResponse({})
    expect(result.results).toEqual([])
    expect(result.count).toBe(0)
  })
})

describe('BillingAccountsAdapter.transformDetailResponse', () => {
  it('unwraps the { state, data } envelope', () => {
    const result = BillingAccountsAdapter.transformDetailResponse({
      state: 'executed',
      data: wireBillingAccount
    })

    expect(result.state).toBe('executed')
    expect(result.data.id).toBe(501)
  })

  it('returns null data when the envelope is empty', () => {
    expect(BillingAccountsAdapter.transformDetailResponse({})).toEqual({
      state: null,
      data: null
    })
  })
})

describe('BillingAccountsAdapter.transformCostBreakdownResponse', () => {
  it('unwraps a cost breakdown detail envelope keeping cents', () => {
    const result = BillingAccountsAdapter.transformCostBreakdownResponse({
      state: 'executed',
      data: {
        account_id: 501,
        period: '2026-07',
        currency: 'USD',
        total: 125000,
        items: [{ consuming_account_id: 12, product_id: 3, amount: 125000 }]
      }
    })

    expect(result.state).toBe('executed')
    expect(result.data.total).toBe(125000)
    expect(result.data.items[0].amount).toBe(125000)
  })

  it('returns null data when the envelope is empty', () => {
    expect(BillingAccountsAdapter.transformCostBreakdownResponse({})).toEqual({
      state: null,
      data: null
    })
  })
})

describe('BillingAccountsAdapter payload builders', () => {
  it('builds a strict create payload without owner_account_id', () => {
    const result = BillingAccountsAdapter.toCreatePayload({
      ownerAccountId: 900,
      currency: 'USD',
      country: 'US'
    })

    expect(result).toEqual({ currency: 'USD', country: 'US' })
    expect(result.owner_account_id).toBeUndefined()
  })

  it('builds a full create payload with optional fields but never owner_account_id', () => {
    const result = BillingAccountsAdapter.toCreatePayload({
      ownerAccountId: 900,
      currency: 'USD',
      country: 'US',
      accountType: 'invoiced',
      taxId: '12-3456789',
      legalEntityName: 'Acme Inc'
    })

    expect(result).toEqual({
      currency: 'USD',
      country: 'US',
      account_type: 'invoiced',
      tax_id: '12-3456789',
      legal_entity_name: 'Acme Inc'
    })
    expect(result.owner_account_id).toBeUndefined()
  })

  it('drops unknown create fields so the body honors additionalProperties:false', () => {
    expect(
      BillingAccountsAdapter.toCreatePayload({
        ownerAccountId: 900,
        currency: 'USD',
        country: 'US',
        bogus: 'x'
      })
    ).toEqual({ currency: 'USD', country: 'US' })
  })

  it('builds an update payload limited to tax_id and legal_entity_name', () => {
    expect(
      BillingAccountsAdapter.toUpdatePayload({
        taxId: '12-3456789',
        legalEntityName: 'Acme Inc',
        defaultPaymentMethodId: 44,
        billingEmails: ['billing@acme.com'],
        address: {
          line1: '1 Main St',
          postalCode: '62704'
        }
      })
    ).toEqual({
      tax_id: '12-3456789',
      legal_entity_name: 'Acme Inc'
    })
  })

  it('builds a partial update payload and drops unknown fields', () => {
    expect(BillingAccountsAdapter.toUpdatePayload({ taxId: '999', bogus: 'x' })).toEqual({
      tax_id: '999'
    })
    expect(BillingAccountsAdapter.toUpdatePayload({})).toEqual({})
  })

  it('builds snake_case list params', () => {
    expect(
      BillingAccountsAdapter.toListParams({
        page: 2,
        pageSize: 50,
        fields: 'id,status',
        account: 900,
        status: 'active'
      })
    ).toEqual({
      page: 2,
      page_size: 50,
      fields: 'id,status',
      account: 900,
      status: 'active'
    })
  })

  it('builds cost breakdown params scoped to a period', () => {
    expect(BillingAccountsAdapter.toCostBreakdownParams({ period: '2026-07' })).toEqual({
      period: '2026-07'
    })
    expect(BillingAccountsAdapter.toCostBreakdownParams({})).toEqual({})
  })
})
