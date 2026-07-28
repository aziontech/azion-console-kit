import { describe, expect, it } from 'vitest'
import { PaymentMethodsAdapter } from '@/services/v2/billing-api/payment-methods/payment-methods-adapter'
import {
  PAYMENT_METHOD_TYPE,
  PAYMENT_METHOD_STATUS
} from '@/services/v2/billing-api/payment-methods/payment-methods-constants'

const wirePaymentMethod = {
  id: 501,
  created_at: '2026-07-01T00:00:00Z',
  last_modified: '2026-07-10T00:00:00Z',
  last_editor: 'user@azion.com',
  account_id: 900,
  type: 'card',
  gateway: 'stripe',
  payment_method_ref: 'pm_123',
  mandate_ref: 'mandate_1',
  brand: 'visa',
  last4: '4242',
  exp_month: 12,
  exp_year: 2030,
  is_default: true,
  status: 'active'
}

describe('payment-methods-constants', () => {
  it('mirrors the contract payment method type enum', () => {
    expect(PAYMENT_METHOD_TYPE).toEqual({
      CARD: 'card',
      WALLET: 'wallet',
      PAYPAL: 'paypal',
      ACH: 'ach',
      SEPA: 'sepa',
      PIX: 'pix',
      BOLETO: 'boleto',
      WIRE: 'wire',
      BANK_TRANSFER: 'bank_transfer',
      CHECK: 'check'
    })
    expect(Object.isFrozen(PAYMENT_METHOD_TYPE)).toBe(true)
  })

  it('mirrors the contract payment method status enum', () => {
    expect(PAYMENT_METHOD_STATUS).toEqual({
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      EXPIRED: 'expired',
      PENDING: 'pending'
    })
    expect(Object.isFrozen(PAYMENT_METHOD_STATUS)).toBe(true)
  })
})

describe('PaymentMethodsAdapter.transformPaymentMethod', () => {
  it('unwraps the { state, data } envelope and maps snake_case to camelCase', () => {
    const result = PaymentMethodsAdapter.transformPaymentMethod({
      state: 'executed',
      data: wirePaymentMethod
    })

    expect(result.state).toBe('executed')
    expect(result.data).toEqual({
      id: 501,
      accountId: 900,
      type: 'card',
      gateway: 'stripe',
      paymentMethodRef: 'pm_123',
      mandateRef: 'mandate_1',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
      isDefault: true,
      status: 'active',
      audit: {
        createdAt: '2026-07-01T00:00:00Z',
        lastModified: '2026-07-10T00:00:00Z',
        lastEditor: 'user@azion.com'
      }
    })
  })

  it('defaults nullable fields when absent', () => {
    const result = PaymentMethodsAdapter.transformPaymentMethod({
      state: 'executed',
      data: {
        id: 502,
        created_at: '2026-07-01T00:00:00Z',
        last_modified: '2026-07-01T00:00:00Z',
        account_id: 900,
        type: 'pix',
        is_default: false,
        status: 'pending'
      }
    })

    expect(result.data.gateway).toBeNull()
    expect(result.data.paymentMethodRef).toBeNull()
    expect(result.data.mandateRef).toBeNull()
    expect(result.data.brand).toBeNull()
    expect(result.data.last4).toBeNull()
    expect(result.data.expMonth).toBeNull()
    expect(result.data.expYear).toBeNull()
    expect(result.data.isDefault).toBe(false)
    expect(result.data.audit.lastEditor).toBeNull()
  })

  it('returns null data when the envelope is empty', () => {
    expect(PaymentMethodsAdapter.transformPaymentMethod({})).toEqual({
      state: null,
      data: null
    })
  })
})

describe('PaymentMethodsAdapter.transformList', () => {
  it('maps a populated bare array of payment methods', () => {
    const result = PaymentMethodsAdapter.transformList([
      wirePaymentMethod,
      {
        id: 502,
        created_at: '2026-07-01T00:00:00Z',
        last_modified: '2026-07-01T00:00:00Z',
        last_editor: null,
        account_id: 900,
        type: 'boleto',
        is_default: false,
        status: 'inactive'
      }
    ])

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(501)
    expect(result[0].isDefault).toBe(true)
    expect(result[0].brand).toBe('visa')
    expect(result[1].type).toBe('boleto')
    expect(result[1].gateway).toBeNull()
    expect(result[1].audit.lastEditor).toBeNull()
  })

  it('returns an empty array for a non-array response', () => {
    expect(PaymentMethodsAdapter.transformList(undefined)).toEqual([])
    expect(PaymentMethodsAdapter.transformList(null)).toEqual([])
    expect(PaymentMethodsAdapter.transformList({})).toEqual([])
  })
})

describe('PaymentMethodsAdapter.transformSetupSession', () => {
  it('unwraps the { state, data } setup session envelope', () => {
    const result = PaymentMethodsAdapter.transformSetupSession({
      state: 'executed',
      data: {
        setup_session_id: 'seti_1',
        client_secret: 'seti_secret_123',
        gateway: 'stripe'
      }
    })

    expect(result.state).toBe('executed')
    expect(result.data).toEqual({
      setupSessionId: 'seti_1',
      clientSecret: 'seti_secret_123',
      gateway: 'stripe'
    })
  })

  it('returns null data when the envelope is empty', () => {
    expect(PaymentMethodsAdapter.transformSetupSession({})).toEqual({
      state: null,
      data: null
    })
  })
})

describe('PaymentMethodsAdapter.toSetupSessionPayload', () => {
  it('builds a payload with the provided type', () => {
    expect(PaymentMethodsAdapter.toSetupSessionPayload({ type: 'card' })).toEqual({
      type: 'card'
    })
  })

  it('omits type when not provided so the server default applies', () => {
    expect(PaymentMethodsAdapter.toSetupSessionPayload()).toEqual({})
    expect(PaymentMethodsAdapter.toSetupSessionPayload({})).toEqual({})
  })

  it('drops unknown fields so the body honors additionalProperties:false', () => {
    expect(PaymentMethodsAdapter.toSetupSessionPayload({ type: 'wallet', bogus: 'x' })).toEqual({
      type: 'wallet'
    })
  })
})

describe('PaymentMethodsAdapter.toWalletRows', () => {
  const method = (overrides = {}) => ({
    id: 'pm_1',
    brand: 'visa',
    last4: '4242',
    expMonth: 11,
    expYear: 2099,
    isDefault: false,
    ...overrides
  })

  it('maps a card to the wallet table row shape', () => {
    const [row] = PaymentMethodsAdapter.toWalletRows([method()])

    expect(row.id).toBe('pm_1')
    expect(row.cardData.cardNumber).toBe('Ending in 4242')
    expect(row.cardData.cardBrand).toBe('visa')
    expect(row.cardNumberSearch).toBe('visa 4242')
    expect(row.cardExpiration.text).toBe('11/2099')
  })

  it('flags the default card and sorts it first', () => {
    const rows = PaymentMethodsAdapter.toWalletRows([
      method({ id: 'pm_other', last4: '1881' }),
      method({ id: 'pm_default', isDefault: true })
    ])

    expect(rows[0].id).toBe('pm_default')
    expect(rows[0].isDefault).toBe(true)
    expect(rows[0].cardData.status).toBe('Default')
    expect(rows[1].isDefault).toBeUndefined()
    expect(rows[1].cardData.status).toBeUndefined()
  })

  it('omits the expiration cell when the gateway did not return one', () => {
    const [row] = PaymentMethodsAdapter.toWalletRows([method({ expMonth: null, expYear: null })])

    expect(row.cardExpiration).toBeUndefined()
    expect(row.expiringDateByOrder).toBeUndefined()
    expect(row.cardData.cardNumber).toBe('Ending in 4242')
  })

  it('returns an empty list for a non-array payload', () => {
    expect(PaymentMethodsAdapter.toWalletRows(null)).toEqual([])
    expect(PaymentMethodsAdapter.toWalletRows(undefined)).toEqual([])
    expect(PaymentMethodsAdapter.toWalletRows({})).toEqual([])
  })
})
