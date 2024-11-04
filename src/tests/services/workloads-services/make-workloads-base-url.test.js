import { makeWorkloadsBaseUrl } from '@/services/workloads-services/make-workloads-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeWorkloadsBaseUrl

  return {
    sut
  }
}

describe('WorkloadsServices', () => {
  it('should return the API base url to workloads service', () => {
    const { sut } = makeSut()
    const correctApiUrl = `v4/workspace/workloads`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
