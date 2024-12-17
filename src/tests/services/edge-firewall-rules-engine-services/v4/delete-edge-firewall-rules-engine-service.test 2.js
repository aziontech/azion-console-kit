import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services/v4'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const makeSut = () => {
  const sut = deleteEdgeFirewallRulesEngineService

  return {
    sut
  }
}

const ruleEngineId = 12387555
const edgeFirewallId = 4245

describe('EdgeFirewallRulesEngineServicesV4', () => {
  it('should call Api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()
    await sut({ ruleEngineId, edgeFirewallId })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `v4/edge_firewall/firewalls/${edgeFirewallId}/rules/${ruleEngineId}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()

    const feedbackMessage = await sut({ ruleEngineId, edgeFirewallId })

    expect(feedbackMessage).toBe('Rules Engine successfully deleted')
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut({ ruleEngineId, edgeFirewallId })

    await expect(apiErrorResponse).rejects.toThrow('error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut({ ruleEngineId, edgeFirewallId })
    const expectedError = new Errors.InternalServerError().message

    await expect(apiErrorResponse).rejects.toThrow(expectedError)
  })
})
