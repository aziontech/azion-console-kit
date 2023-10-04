import { makeDataStreamingTemplateBaseUrl } from '@/services/data-streaming-services/make-data-streaming-template-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDataStreamingTemplateBaseUrl

  return {
    sut
  }
}

describe('AuthServices', () => {
  it('should return the API base url to data streaming service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'data_streaming/templates'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
