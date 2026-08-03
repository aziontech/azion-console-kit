// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import { BillingGqlService } from '@/services/v2/billing/billing-gql-service'
import { spyHttpRequest } from '../../../support/versioning/boundaries'

/**
 * Billing GraphQL orchestration (trial credit banner): two sequential GQL
 * POSTs → adapters → {credit, formatCredit, days}. Real service + adapters;
 * only the HTTP boundary stubbed. Time frozen for deterministic day math.
 */
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const freezeAt = (iso) => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

describe('fetchCreditAndExpirationDate', () => {
  it('chains the trial-credit and bill queries and returns the remaining credit', async () => {
    freezeAt('2026-07-22T12:00:00Z')
    const http = spyHttpRequest()
    // 1ª chamada: balanceFinancialEntry (crédito de trial)
    // envelope real: o service desembrulha { data } do http E { data } do GQL
    http.respondWith({
      data: {
        lastTrialCredit: [{ amount: 300, expirationDate: '2026-08-01', created: '2026-07-01' }]
      }
    })
    // 2ª chamada: billDetail (consumo)
    http.respondWith({ data: { bill: [{ totalValue: '120.5' }] } })

    const result = await new BillingGqlService().fetchCreditAndExpirationDate()

    expect(result).toEqual({ credit: 179.5, formatCredit: '179.5', days: 11 })

    const [first, second] = http.spy.mock.calls.map(([request]) => request)
    expect(first).toMatchObject({ method: 'POST', url: 'v4/billing/graphql' })
    expect(first.body.query).toContain('balanceFinancialEntry')
    expect(second.body.query).toContain('billDetail')
    // a janela do bill começa na criação do crédito
    expect(second.body.variables.from_date).toBe('2026-07-01')
    expect(second.body.variables.to_date).toBeTruthy()
  })

  it('short-circuits to {} when there is no credit amount (no second query)', async () => {
    freezeAt('2026-07-22T12:00:00Z')
    const http = spyHttpRequest()
    http.respondWith({ data: { lastTrialCredit: [] } })

    const result = await new BillingGqlService().fetchCreditAndExpirationDate()

    expect(result).toEqual({})
    expect(http.spy).toHaveBeenCalledTimes(1)
  })

  it('degrades to the zeroed shape when the API fails (banner never crashes)', async () => {
    const http = spyHttpRequest()
    http.rejectNext(new Error('gql down'))

    const result = await new BillingGqlService().fetchCreditAndExpirationDate()

    expect(result).toEqual({ credit: 0, formatCredit: '0,00', days: 0 })
  })
})
