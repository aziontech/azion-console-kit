import { makePaymentBaseUrl } from '@/services/billing-services/make-payment-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makePaymentBaseUrl

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should return the API base url to payment service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/payments`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
