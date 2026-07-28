import { describe, expect, it } from 'vitest'
import { LegacyWalletAdapter } from '@/services/v2/billing-legacy/wallet/legacy-wallet-adapter'

describe('transformBillingPaymentMethodsResponse', () => {
  const v4Envelope = {
    state: 'executed',
    data: {
      object: 'list',
      payment_methods: [
        {
          id: 'pm_xxx',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2030,
          funding: 'credit',
          country: 'US',
          is_default: true
        },
        {
          id: 'pm_yyy',
          type: 'card',
          brand: 'mastercard',
          last4: '5151',
          exp_month: 6,
          exp_year: 2028,
          funding: 'debit',
          country: 'BR',
          is_default: false
        }
      ],
      billing_address: {
        line1: '123 Main St',
        line2: null,
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94107',
        country: 'US'
      },
      customer_email: 'user@example.com',
      customer_name: 'Test User',
      stale: false
    }
  }

  it('maps payment methods list with default flag', () => {
    const result = LegacyWalletAdapter.transformBillingPaymentMethodsResponse(v4Envelope)
    expect(result.paymentMethods).toHaveLength(2)
    expect(result.paymentMethods[0]).toEqual({
      id: 'pm_xxx',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
      funding: 'credit',
      country: 'US',
      isDefault: true
    })
    expect(result.paymentMethods[1].isDefault).toBe(false)
  })

  it('identifies defaultPaymentMethod from is_default flag', () => {
    const result = LegacyWalletAdapter.transformBillingPaymentMethodsResponse(v4Envelope)
    expect(result.defaultPaymentMethod?.id).toBe('pm_xxx')
    expect(result.defaultPaymentMethod?.last4).toBe('4242')
  })

  it('returns null defaultPaymentMethod when none flagged', () => {
    const envelope = {
      state: 'executed',
      data: {
        object: 'list',
        payment_methods: [{ id: 'pm_a', type: 'card', brand: 'visa', last4: '0001' }]
      }
    }
    const result = LegacyWalletAdapter.transformBillingPaymentMethodsResponse(envelope)
    expect(result.defaultPaymentMethod).toBeNull()
    expect(result.paymentMethods[0].isDefault).toBe(false)
  })

  it('maps billing_address to camelCase', () => {
    const result = LegacyWalletAdapter.transformBillingPaymentMethodsResponse(v4Envelope)
    expect(result.billingAddress).toEqual({
      line1: '123 Main St',
      line2: null,
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107',
      country: 'US'
    })
  })

  it('returns empty list when payment_methods absent', () => {
    const result = LegacyWalletAdapter.transformBillingPaymentMethodsResponse({
      state: 'executed',
      data: {}
    })
    expect(result.paymentMethods).toEqual([])
    expect(result.defaultPaymentMethod).toBeNull()
  })

  it('preserves stale flag from snapshot fallback', () => {
    const envelope = { state: 'executed', data: { payment_methods: [], stale: true } }
    expect(LegacyWalletAdapter.transformBillingPaymentMethodsResponse(envelope).stale).toBe(true)
  })
})
