import { makeDataStreamTemplateBaseUrl } from '@/services/data-stream-services/make-data-stream-template-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDataStreamTemplateBaseUrl

  return {
    sut
  }
}

describe('DataStreamServices', () => {
  it('should return the API base url to data stream templates service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/data_streaming/templates`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
