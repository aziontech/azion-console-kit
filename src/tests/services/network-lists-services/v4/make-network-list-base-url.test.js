import { makeNetworkListBaseUrl } from '@/services/network-lists-services/v4/make-network-list-service'
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
    const version = 'v4'
    const correctApiUrl = `${version}/workspace/network_lists`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
