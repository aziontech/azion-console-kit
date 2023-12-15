import { makeNetworkListBaseUrl } from '@/services/network-lists-services/make-network-list-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeNetworkListBaseUrl

  return {
    sut
  }
}

describe('NetworkListsServices', () => {
  it('should return the API base url to network service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/network_lists`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
