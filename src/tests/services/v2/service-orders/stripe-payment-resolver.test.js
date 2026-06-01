import { describe, expect, it } from 'vitest'
import {
  resolvePaymentFromResponse,
  resolveServiceOrderPaymentMeta
} from '@/services/v2/service-orders/stripe-payment-resolver'

describe('resolveServiceOrderPaymentMeta', () => {
  it('returns nulls for empty / non-object input', () => {
    expect(resolveServiceOrderPaymentMeta(null)).toEqual({
      clientSecret: null,
      checkoutSessionId: null
    })
    expect(resolveServiceOrderPaymentMeta(undefined)).toEqual({
      clientSecret: null,
      checkoutSessionId: null
    })
    expect(resolveServiceOrderPaymentMeta('bad')).toEqual({
      clientSecret: null,
      checkoutSessionId: null
    })
  })

  it('extracts camelCase client secret from the root', () => {
    expect(
      resolveServiceOrderPaymentMeta({ clientSecret: 'cs_root', checkoutSessionId: 'cs_id_root' })
    ).toEqual({ clientSecret: 'cs_root', checkoutSessionId: 'cs_id_root' })
  })

  it('extracts snake_case client_secret nested under metadata first', () => {
    expect(
      resolveServiceOrderPaymentMeta({
        metadata: { checkout_session_client_secret: 'cs_meta' },
        clientSecret: 'cs_root'
      })
    ).toEqual({ clientSecret: 'cs_meta', checkoutSessionId: null })
  })

  it('walks into payment / session / checkout / stripe containers', () => {
    expect(
      resolveServiceOrderPaymentMeta({ payment: { client_secret: 'cs_payment' } })
    ).toMatchObject({ clientSecret: 'cs_payment' })
    expect(
      resolveServiceOrderPaymentMeta({ stripe: { checkoutSessionClientSecret: 'cs_stripe' } })
    ).toMatchObject({ clientSecret: 'cs_stripe' })
  })

  it('returns nulls when no known secret key is present', () => {
    expect(resolveServiceOrderPaymentMeta({ planId: 'p_1' })).toEqual({
      clientSecret: null,
      checkoutSessionId: null
    })
  })
})

describe('resolvePaymentFromResponse', () => {
  it('returns null when no payment object is present', () => {
    expect(resolvePaymentFromResponse(null)).toBeNull()
    expect(resolvePaymentFromResponse({})).toBeNull()
    expect(resolvePaymentFromResponse({ data: {} })).toBeNull()
  })

  it('extracts clientSecret from response.payment', () => {
    expect(resolvePaymentFromResponse({ payment: { clientSecret: 'pi_secret' } })).toEqual({
      clientSecret: 'pi_secret'
    })
  })

  it('extracts clientSecret from response.data.payment with snake_case', () => {
    expect(
      resolvePaymentFromResponse({ data: { payment: { client_secret: 'pi_secret_snake' } } })
    ).toEqual({ clientSecret: 'pi_secret_snake' })
  })

  it('returns null when payment object lacks a known secret key', () => {
    expect(resolvePaymentFromResponse({ payment: { status: 'requires_action' } })).toBeNull()
  })
})
