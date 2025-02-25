import { makeBillingBaseUrl } from '@/services/billing-services/make-billing-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeBillingBaseUrl

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should return the API base url to billing service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'v4/billing/graphql'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
