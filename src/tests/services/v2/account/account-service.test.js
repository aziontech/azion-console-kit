import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountService } from '@/services/v2/account/account-service'

describe('AccountService._adaptAccountInfo', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    localStorage.clear()
  })

  it('maps has_service_order_plan explicitly when backend returns true', () => {
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      has_service_order_plan: true
    })

    expect(result.hasServiceOrderPlan).toBe(true)
  })

  it('defaults has_service_order_plan to false when backend omits it', () => {
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client'
    })

    expect(result.hasServiceOrderPlan).toBe(false)
  })

  it('does not trust non-boolean has_service_order_plan values', () => {
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      has_service_order_plan: 'true'
    })

    expect(result.hasServiceOrderPlan).toBe(false)
  })

  it('passes through the backend billing_type value', () => {
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBe('plan')
  })

  it('normalizes a missing billing_type to null', () => {
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client'
    })

    expect(result.billing_type).toBeNull()
  })

  it('forces billing_type to null when the override is set to null', () => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', 'null')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBeNull()
  })

  it('forces billing_type to the override value when set', () => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', 'custom')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: null
    })

    expect(result.billing_type).toBe('custom')
  })

  it('falls back to the localStorage override when the env override is not set', () => {
    localStorage.setItem('billing_type_override', 'custom')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBe('custom')
  })

  it('forces billing_type to null when the localStorage override is set to null', () => {
    localStorage.setItem('billing_type_override', 'null')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBeNull()
  })

  it('prefers the env override over the localStorage override', () => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', 'fromEnv')
    localStorage.setItem('billing_type_override', 'fromStorage')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBe('fromEnv')
  })
})
