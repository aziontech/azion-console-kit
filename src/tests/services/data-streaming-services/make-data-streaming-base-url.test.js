import { makeDataStreamingBaseUrl } from '@/services/data-streaming-services/make-data-streaming-base-url'
import { assert, describe, it } from 'vitest'
makeDataStreamingBaseUrl

const makeSut = () => {
  const sut = makeDataStreamingBaseUrl

  return {
    sut
  }
}

describe('AuthServices', () => {
  it('should return the API base url to data streaming service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'data_streaming/streamings'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
