import { describe, expect, it } from 'vitest'
import { CreditsAdapter } from '@/services/v2/billing-api/credits/credits-adapter'
import { CREDIT_ENTRY_TYPE } from '@/services/v2/billing-api/credits/credits-constants'

const wireBalance = {
  account_id: 900,
  currency: 'USD',
  available_amount: 15000
}

const wireCreditEntry = {
  id: 501,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: 'admin@azion.com',
  account_id: 900,
  amount: 10000,
  remaining_amount: 7500,
  type: 'incentive',
  source_ref: 'promo-2026',
  expires_at: '2026-12-31T00:00:00Z'
}

const wireListEnvelope = {
  count: 1,
  total_pages: 1,
  page: 1,
  page_size: 20,
  next: null,
  previous: null,
  results: [wireCreditEntry]
}

describe('CreditsAdapter.transformBalance', () => {
  it('maps the balance keeping the amount as integer cents', () => {
    expect(CreditsAdapter.transformBalance(wireBalance)).toEqual({
      accountId: 900,
      currency: 'USD',
      availableAmount: 15000
    })
  })
})

describe('CreditsAdapter.transformCreditEntry', () => {
  it('maps snake_case wire fields to camelCase with amounts in cents', () => {
    const result = CreditsAdapter.transformCreditEntry(wireCreditEntry)

    expect(result).toEqual({
      id: 501,
      accountId: 900,
      amount: 10000,
      remainingAmount: 7500,
      type: 'incentive',
      sourceRef: 'promo-2026',
      expiresAt: '2026-12-31T00:00:00Z',
      audit: {
        createdAt: '2026-07-01T00:00:00Z',
        lastModified: '2026-07-10T00:00:00Z',
        lastEditor: 'admin@azion.com'
      }
    })
  })

  it('defaults nullable fields including the nullable created_at', () => {
    const result = CreditsAdapter.transformCreditEntry({
      id: 502,
      last_modified: '2026-07-10T00:00:00Z',
      last_editor: null,
      account_id: 900,
      amount: 500,
      remaining_amount: 500,
      type: 'refund'
    })

    expect(result.sourceRef).toBeNull()
    expect(result.expiresAt).toBeNull()
    expect(result.audit.createdAt).toBeNull()
    expect(result.audit.lastEditor).toBeNull()
  })
})

describe('CreditsAdapter.transformBalanceResponse', () => {
  it('unwraps the { state, data } envelope', () => {
    const result = CreditsAdapter.transformBalanceResponse({
      state: 'executed',
      data: wireBalance
    })

    expect(result.state).toBe('executed')
    expect(result.data).toEqual({ accountId: 900, currency: 'USD', availableAmount: 15000 })
  })

  it('returns null data when the envelope is empty', () => {
    expect(CreditsAdapter.transformBalanceResponse({})).toEqual({ state: null, data: null })
  })
})

describe('CreditsAdapter.transformListResponse', () => {
  it('maps a populated v4 paginated envelope', () => {
    const result = CreditsAdapter.transformListResponse(wireListEnvelope)

    expect(result.count).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.next).toBeNull()
    expect(result.previous).toBeNull()
    expect(result.results).toHaveLength(1)
    expect(result.results[0].id).toBe(501)
    expect(result.results[0].amount).toBe(10000)
    expect(result.results[0].remainingAmount).toBe(7500)
  })

  it('returns an empty list for a malformed envelope', () => {
    const result = CreditsAdapter.transformListResponse({})
    expect(result.results).toEqual([])
    expect(result.count).toBe(0)
  })
})

describe('CreditsAdapter.toListParams', () => {
  it('builds snake_case list params', () => {
    expect(CreditsAdapter.toListParams({ page: 2, pageSize: 50 })).toEqual({
      page: 2,
      page_size: 50
    })
  })

  it('drops undefined params', () => {
    expect(CreditsAdapter.toListParams()).toEqual({})
  })
})

describe('CREDIT_ENTRY_TYPE constants', () => {
  it('exposes the frozen credit entry type enum', () => {
    expect(CREDIT_ENTRY_TYPE).toEqual({
      INCENTIVE: 'incentive',
      REFUND: 'refund',
      ADJUSTMENT: 'adjustment',
      PREPAY: 'prepay',
      AUTO_RECHARGE: 'auto_recharge'
    })
    expect(Object.isFrozen(CREDIT_ENTRY_TYPE)).toBe(true)
  })
})
