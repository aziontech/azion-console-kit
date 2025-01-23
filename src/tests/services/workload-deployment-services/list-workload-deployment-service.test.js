import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWorkloadDeploymentsService } from '@/services/workload-deployment-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  workloadDeploymentMock: {
    id: 10,
    tag: 'default',
    binds: {
      edge_application: 1,
      edge_firewall: 0
    },
    current: true
  }
}

const makeSut = () => {
  const sut = listWorkloadDeploymentsService

  return {
    sut
  }
}

describe('WorkloadDeploymentServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.workloadDeploymentMock]
      }
    })

    const domainId = 102820

    const { sut } = makeSut()
    const version = 'v4'
    await sut({ id: domainId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/workloads/${domainId}/deployments?ordering=name&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parsed correctly each network record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      count: 1,
      body: {
        results: [fixtures.workloadDeploymentMock]
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual({
      current: fixtures.workloadDeploymentMock.current,
      edgeApplication: fixtures.workloadDeploymentMock.binds.edge_application,
      edgeFirewall: fixtures.workloadDeploymentMock.binds.edge_firewall,
      id: fixtures.workloadDeploymentMock.id,
      tag: fixtures.workloadDeploymentMock.tag
    })
  })
})
