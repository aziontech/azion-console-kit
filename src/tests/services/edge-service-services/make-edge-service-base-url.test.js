import { makeEdgeServiceBaseUrl } from '@/services/edge-service-services/make-edge-service-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeServiceBaseUrl

  return {
    sut
  }
}

describe('EdgeServiceServices', () => {
  it('should return the API base url to edge services service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/edge_services`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
