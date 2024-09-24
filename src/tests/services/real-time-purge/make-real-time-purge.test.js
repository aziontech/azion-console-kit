import { makeRealTimePurgeBaseUrl } from '@/services/real-time-purge/make-real-time-purge-service'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeRealTimePurgeBaseUrl

  return {
    sut
  }
}

describe('RealTimePurgeServices', () => {
  it('should return the API base url to real-time purge', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/workspace/purge`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
