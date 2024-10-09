import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteEdgeFirewallRulesEngineService

  return {
    sut
  }
}

describe('EdgeFirewallRulesEngineServices', () => {
  it('should call Api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const ruleEngineId = 12387555
    const edgeFirewallId = 4245
    const { sut } = makeSut()
    await sut({ ruleEngineId, edgeFirewallId })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `v3/edge_firewall/${edgeFirewallId}/rules_engine/${ruleEngineId}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const ruleEngineId = 12387555
    const edgeFirewallId = 4245

    const { sut } = makeSut()

    const feedbackMessage = await sut({ ruleEngineId, edgeFirewallId })

    expect(feedbackMessage).toBe('Rules Engine successfully deleted')
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const ruleEngineId = 12387555
      const edgeFirewallId = 4245

      const response = sut({ ruleEngineId, edgeFirewallId })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
