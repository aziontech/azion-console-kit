import { makeEdgeFunctionsBaseUrl } from '@/services/edge-functions-services/v4/make-edge-functions-base-url'
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
    const version = 'v4'
    const correctApiUrl = `${version}/edge_functions/functions`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
