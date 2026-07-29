import { describe, expect, it } from 'vitest'
import { PaymentsAdapter } from '@/services/v2/billing-api/payments/payments-adapter'

const wirePayment = {
  id: 501,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: 'user@azion.com',
  invoice_id: 88,
  account_id: 900,
  amount: 2450,
  currency: 'USD',
  payment_method_id: 44,
  payment_method_ref: 'pm_ref_123',
  gateway: 'stripe',
  gateway_charge_ref: 'ch_123',
  status: 'succeeded',
  attempts: [
    {
      attempt_no: 1,
      status: 'failed',
      error_code: 'card_declined',
      created_at: '2026-07-01T00:00:00Z'
    },
    { attempt_no: 2, status: 'succeeded', error_code: null, created_at: null }
  ]
}

describe('PaymentsAdapter.transformPayment', () => {
  it('maps snake_case wire fields to camelCase and keeps amount as integer cents', () => {
    const result = PaymentsAdapter.transformPayment(wirePayment)

    expect(result).toEqual({
      id: 501,
      invoiceId: 88,
      accountId: 900,
      amount: 2450,
      currency: 'USD',
      paymentMethodId: 44,
      paymentMethodRef: 'pm_ref_123',
      gateway: 'stripe',
      gatewayChargeRef: 'ch_123',
      status: 'succeeded',
      attempts: [
        {
          attemptNo: 1,
          status: 'failed',
          errorCode: 'card_declined',
          createdAt: '2026-07-01T00:00:00Z'
        },
        { attemptNo: 2, status: 'succeeded', errorCode: null, createdAt: null }
      ],
      audit: {
        createdAt: '2026-07-01T00:00:00Z',
        lastModified: '2026-07-10T00:00:00Z',
        lastEditor: 'user@azion.com'
      }
    })
  })

  it('defaults nullable fields and empty attempts when absent', () => {
    const result = PaymentsAdapter.transformPayment({
      id: 1,
      created_at: '2026-07-01T00:00:00Z',
      last_modified: '2026-07-01T00:00:00Z',
      invoice_id: 2,
      account_id: 3,
      amount: 0,
      currency: 'USD',
      gateway: 'stripe',
      status: 'pending'
    })

    expect(result.paymentMethodId).toBeNull()
    expect(result.paymentMethodRef).toBeNull()
    expect(result.gatewayChargeRef).toBeNull()
    expect(result.attempts).toEqual([])
    expect(result.audit.lastEditor).toBeNull()
  })
})

describe('PaymentsAdapter.transformListResponse', () => {
  it('maps the v4 paginated envelope with populated results', () => {
    const result = PaymentsAdapter.transformListResponse({
      count: 1,
      total_pages: 1,
      page: 1,
      page_size: 20,
      next: null,
      previous: null,
      results: [wirePayment]
    })

    expect(result.count).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.next).toBeNull()
    expect(result.previous).toBeNull()
    expect(result.results).toHaveLength(1)
    expect(result.results[0].id).toBe(501)
    expect(result.results[0].amount).toBe(2450)
  })

  it('returns an empty list for a malformed envelope', () => {
    const result = PaymentsAdapter.transformListResponse({})
    expect(result.results).toEqual([])
    expect(result.count).toBe(0)
  })
})

describe('PaymentsAdapter.transformDetailResponse', () => {
  it('unwraps the { state, data } envelope', () => {
    const result = PaymentsAdapter.transformDetailResponse({ state: 'executed', data: wirePayment })

    expect(result.state).toBe('executed')
    expect(result.data.id).toBe(501)
  })

  it('returns null data when the envelope is empty', () => {
    expect(PaymentsAdapter.transformDetailResponse({})).toEqual({ state: null, data: null })
  })
})

describe('PaymentsAdapter builders', () => {
  it('builds snake_case list params and drops billing_account (not in the contract)', () => {
    expect(
      PaymentsAdapter.toListParams({
        page: 2,
        pageSize: 50,
        fields: 'id,status',
        billingAccount: 1,
        invoice: 88,
        status: 'succeeded'
      })
    ).toEqual({
      page: 2,
      page_size: 50,
      fields: 'id,status',
      invoice: 88,
      status: 'succeeded'
    })
  })

  it('omits undefined list params', () => {
    expect(PaymentsAdapter.toListParams({ status: 'failed' })).toEqual({ status: 'failed' })
    expect(PaymentsAdapter.toListParams()).toEqual({})
  })
})
