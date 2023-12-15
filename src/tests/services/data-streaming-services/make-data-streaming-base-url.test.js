import { makeDataStreamingBaseUrl } from '@/services/data-streaming-services/make-data-streaming-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDataStreamingBaseUrl

  return {
    sut
  }
}

describe('DataStreamingServices', () => {
  it('should return the API base url to data streamings service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/data_streaming/streamings`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
