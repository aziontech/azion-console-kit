import { makeWorkloadsDeploymentBaseUrl } from '@/services/workload-deployment-service/make-workload-deployment-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeWorkloadsDeploymentBaseUrl

  return {
    sut
  }
}

describe('WorkloadDeploymentServices', () => {
  it('should return the API base url to domains service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/workspace/workloads`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
