import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editWorkloadDeploymentService } from '@/services/workload-deployment-service'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const DOMAINID = 123
const fixtures = {
  workloadDeploymentPayload: {
    current: true,
    edgeApplication: 12213,
    edgeFirewall: 11120,
    id: 12,
    tag: 'default'
  }
}

const makeSut = () => {
  const sut = editWorkloadDeploymentService

  return {
    sut
  }
}

describe('WorkloadDeploymentServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()

    await sut({ domainId: DOMAINID, payload: fixtures.workloadDeploymentPayload })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/workspace/workloads/123/deployments/12`,
      method: 'PATCH',
      body: {
        binds: {
          edge_application: fixtures.workloadDeploymentPayload.edgeApplication,
          edge_firewall: fixtures.workloadDeploymentPayload.edgeFirewall
        }
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut({
      domainId: DOMAINID,
      payload: fixtures.workloadDeploymentPayload
    })

    expect(feedbackMessage).toBe('Your Workload deployment has been edited')
  })

  it('Should return an API array error to an invalid device group', async () => {
    const apiErrorMock = 'name should not be empty'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut({ domainId: DOMAINID, payload: fixtures.workloadDeploymentPayload })

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut({ domainId: DOMAINID, payload: fixtures.workloadDeploymentPayload })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
