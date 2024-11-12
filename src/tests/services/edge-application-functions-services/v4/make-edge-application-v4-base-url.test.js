import { makeEdgeFunctionsBaseUrl } from '@/services/edge-application-functions-services/v4/make-edge-function-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeFunctionsBaseUrl

  return {
    sut
  }
}

describe('DomainsServices', () => {
  it('should return the API base url to functions instance service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/edge_application/applications`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
