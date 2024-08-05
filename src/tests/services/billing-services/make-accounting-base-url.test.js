import { makeAccountingBaseUrl } from '@/services/billing-services/make-accounting-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeAccountingBaseUrl

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should return the API base url to billing service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'accounting'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
