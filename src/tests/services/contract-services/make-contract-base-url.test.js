import { makeContractBaseUrl } from '@/services/contract-services'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeContractBaseUrl

  return {
    sut
  }
}

describe('ContractServices', () => {
  it('should return the API base url to contract service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'v3/contract'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
