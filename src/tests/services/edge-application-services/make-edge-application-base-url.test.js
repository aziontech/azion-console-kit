import { makeEdgeApplicationBaseUrl } from '@/services/edge-application-services/make-edge-application-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeApplicationBaseUrl

  return {
    sut
  }
}

describe('EdgeApplicationServices', () => {
  it('should return the API base url to Application service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/edge_applications`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
