// @vitest-environment node
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { criticalAreaSchemas } from '../../../tests/contracts/schemas/critical-areas'
import { PaymentService } from '@/services/v2/payment/payment-service'
import { MFAService } from '@/services/v2/mfa/mfa-service'
import { BillingGqlService } from '@/services/v2/billing/billing-gql-service'
import { AccountService } from '@/services/v2/account/account-service'
import { spyHttpRequest } from '../support/versioning/boundaries'

import creditCardsFixture from '../../../tests/contracts/fixtures/payment.creditCards.json'
import mfaListFixture from '../../../tests/contracts/fixtures/mfa.list.json'
import lastTrialCreditFixture from '../../../tests/contracts/fixtures/billing.lastTrialCredit.json'
import lastBillFixture from '../../../tests/contracts/fixtures/billing.lastBill.json'
import accountInfoFixture from '../../../tests/contracts/fixtures/account.info.json'

/**
 * Consumer contracts for the CRITICAL non-versioned areas (money, auth,
 * identity). Same discipline as the versioning consumer suite: the fixture
 * must satisfy the schema (no lying fixtures), and the service/adapter is
 * driven with that contract-valid fixture through the real HTTP seam.
 */
const validateStrict = (schema, payload) =>
  schema.validateSync(payload, { strict: true, abortEarly: false })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('contract consumer — payment (credit cards)', () => {
  it('FIXTURE: credit-cards list satisfies the response schema', () => {
    expect(() =>
      validateStrict(criticalAreaSchemas.payment.creditCardsListResponse, creditCardsFixture)
    ).not.toThrow()
  })

  it('RESPONSE: a contract-valid list adapts to rows, default card first', async () => {
    const http = spyHttpRequest()
    http.respondWith(creditCardsFixture)

    const { count, body } = await new PaymentService().listCreditCards()

    expect(count).toBe(2)
    expect(body[0]).toMatchObject({
      id: 42,
      cardHolder: 'ANA SILVA',
      isDefault: true,
      cardData: { cardNumber: 'Ending in 4242', cardBrand: 'visa', status: 'Default' }
    })
    expect(body[1].id).toBe(41)
  })

  it('REQUEST: the add-payment-method payload satisfies the create schema', () => {
    // Shape built in src/templates/add-payment-method-block from the Stripe token
    const payload = {
      card_address_zip: '01310-100',
      card_country: 'Brazil',
      stripe_token: 'tok_1abc',
      card_id: 'card_1abc',
      card_brand: 'Visa',
      card_holder: 'ANA SILVA',
      card_last_4_digits: '4242',
      card_expiration_month: 12,
      card_expiration_year: 2099
    }

    expect(() =>
      validateStrict(criticalAreaSchemas.payment.creditCardCreateRequest, payload)
    ).not.toThrow()
  })

  it('REQUEST: addCredit sends exactly { amount } per the schema', async () => {
    const http = spyHttpRequest()
    http.respondWith({})

    await new PaymentService().addCredit({ amount: 50 })

    const sent = http.spy.mock.calls.at(-1)[0].body
    expect(() => validateStrict(criticalAreaSchemas.payment.addCreditRequest, sent)).not.toThrow()
  })
})

describe('contract consumer — mfa', () => {
  it('FIXTURE: mfa list satisfies the response schema', () => {
    expect(() =>
      validateStrict(criticalAreaSchemas.mfa.mfaListResponse, mfaListFixture)
    ).not.toThrow()
  })

  it('RESPONSE: contract-valid entries map confirmed to the severity tag', async () => {
    const http = spyHttpRequest()
    http.respondWith(mfaListFixture)

    const { body } = await new MFAService().listMfaService()

    expect(body[0].confirmed).toEqual({ content: 'Confirmed', severity: 'success' })
    expect(body[1].confirmed).toEqual({ content: 'Not Confirmed', severity: 'danger' })
  })
})

describe('contract consumer — billing (GraphQL)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-22T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('FIXTURES: both GQL bodies satisfy their response schemas', () => {
    expect(() =>
      validateStrict(criticalAreaSchemas.billingGql.lastTrialCreditResponse, lastTrialCreditFixture)
    ).not.toThrow()
    expect(() =>
      validateStrict(criticalAreaSchemas.billingGql.lastBillResponse, lastBillFixture)
    ).not.toThrow()
  })

  it('RESPONSE+REQUEST: contract-valid bodies produce remaining credit; every request is { query, variables? }', async () => {
    const http = spyHttpRequest()
    http.respondWith(lastTrialCreditFixture)
    http.respondWith(lastBillFixture)

    const result = await new BillingGqlService().fetchCreditAndExpirationDate()

    // 300 trial credit - (120.50 + 29.50) billed = 150; expires 2026-08-01 (11 days incl.)
    expect(result.credit).toBe(150)
    expect(result.days).toBe(11)
    for (const call of http.spy.mock.calls) {
      expect(() =>
        validateStrict(criticalAreaSchemas.billingGql.gqlRequest, call[0].body)
      ).not.toThrow()
    }
  })
})

describe('contract consumer — account info', () => {
  it('FIXTURE: account info satisfies the response schema', () => {
    expect(() =>
      validateStrict(criticalAreaSchemas.account.accountInfoResponse, accountInfoFixture)
    ).not.toThrow()
  })

  it('RESPONSE: a contract-valid payload enriches kind into icon/name', async () => {
    const http = spyHttpRequest()
    http.respondWith(accountInfoFixture)

    const result = await new AccountService().fetchAccountInfo()

    expect(result.accountTypeName).toBe('Client')
    expect(result.accountTypeIcon).toBe('pi pi-box')
  })
})
