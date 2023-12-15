import { makeEdgeFunctionsBaseUrl } from '@/services/edge-functions-services/make-edge-functions-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeFunctionsBaseUrl

  return {
    sut
  }
}

describe('EdgeFunctionsServices', () => {
  it('should return the API base url to edge functions service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/edge_functions`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
