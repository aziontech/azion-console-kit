import { describe, expect, it } from 'vitest'
import { AccountService } from '@/services/v2/account/account-service'

describe('AccountService._adaptAccountInfo', () => {
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
})
