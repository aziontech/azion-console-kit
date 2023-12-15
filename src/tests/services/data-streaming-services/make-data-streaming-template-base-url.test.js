import { makeDataStreamingTemplateBaseUrl } from '@/services/data-streaming-services/make-data-streaming-template-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDataStreamingTemplateBaseUrl

  return {
    sut
  }
}

describe('DataStreamingServices', () => {
  it('should return the API base url to data streaming templates service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/data_streaming/templates`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
