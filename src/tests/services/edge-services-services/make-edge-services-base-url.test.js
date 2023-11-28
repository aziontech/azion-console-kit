import { makeEdgeServicesBaseUrl } from '@/services/edge-services-service/make-edge-services-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeServicesBaseUrl

  return {
    sut
  }
}

describe('EdgeServicesServices', () => {
  it('should return the API base url to edge services service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'edge-services'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
