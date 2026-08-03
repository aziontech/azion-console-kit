// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import { BillingGqlAdapter } from '@/services/v2/billing/billing-gql-adapter'

afterEach(() => {
  vi.useRealTimers()
})

describe('transformCreditAndExpirationDate', () => {
  it('extracts amount, creation date and remaining days from the first trial credit', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-22T12:00:00Z'))

    const result = BillingGqlAdapter.transformCreditAndExpirationDate({
      lastTrialCredit: [{ amount: 300, expirationDate: '2026-08-01', created: '2026-07-01' }]
    })

    expect(result.amount).toBe(300)
    expect(result.lastRecordGenerationDate).toBe('2026-07-01')
    // getRemainingDays counts INCLUSIVELY (diff + 1): 22/07 → 01/08 = 11
    expect(result.days).toBe(11)
  })

  it('falls back to zeros when there is no trial credit entry', () => {
    expect(BillingGqlAdapter.transformCreditAndExpirationDate({ lastTrialCredit: [] })).toEqual({
      amount: 0,
      lastRecordGenerationDate: null,
      days: 0
    })
  })
})

describe('transformMessageCreditAndExpirationDate', () => {
  it('subtracts the billed total from the credit and formats the remainder', () => {
    const result = BillingGqlAdapter.transformMessageCreditAndExpirationDate(
      [{ totalValue: '30' }, { totalValue: '20.5' }],
      100
    )

    expect(result.credit).toBe(49.5)
    expect(result.formatCredit).toBe('49.5')
  })

  it('floors the credit at zero when the bill exceeds the credit', () => {
    const result = BillingGqlAdapter.transformMessageCreditAndExpirationDate(
      [{ totalValue: '150' }],
      100
    )

    expect(result.credit).toBe(0)
    expect(result.formatCredit).toBe('0')
  })

  it('ignores non-numeric totalValue entries instead of poisoning the sum', () => {
    const result = BillingGqlAdapter.transformMessageCreditAndExpirationDate(
      [{ totalValue: 'not-a-number' }, { totalValue: '10' }],
      100
    )

    expect(result.credit).toBe(90)
  })

  it('returns an empty object when the bill payload is not a list', () => {
    expect(BillingGqlAdapter.transformMessageCreditAndExpirationDate(null, 100)).toEqual({})
  })
})
