import { makeResourcesBaseUrl } from '@/services/edge-service-resources-services/make-resources-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeResourcesBaseUrl

  return {
    sut
  }
}

describe('EdgeServiceServices', () => {
  it('should return the API base url to edge services service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'edge_services'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
