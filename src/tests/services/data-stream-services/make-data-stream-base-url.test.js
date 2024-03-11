import { makeDataStreamBaseUrl } from '@/services/data-stream-services/make-data-stream-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDataStreamBaseUrl

  return {
    sut
  }
}

describe('DataStreamServices', () => {
  it('should return the API base url to data streams service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/data_streaming/streamings`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
