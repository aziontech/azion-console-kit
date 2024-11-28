import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteEdgeFirewallService } from '@/services/edge-firewall-services/v4'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteEdgeFirewallService

  return {
    sut
  }
}

describe('EdgeFirewallServicesV4', () => {
  it('should call Api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const mockId = 12387555
    const { sut } = makeSut()
    await sut(mockId)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `v4/edge_firewall/firewalls/${mockId}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const mockId = 123

    const { sut } = makeSut()

    const feedbackMessage = await sut(mockId)

    expect(feedbackMessage).toBe('Edge Firewall successfully deleted')
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })
    const mockId = 123

    const { sut } = makeSut()

    const apiErrorResponse = sut(mockId)

    await expect(apiErrorResponse).rejects.toThrow('error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { data: { id: '123' } }
    })
    const mockId = 123

    const { sut } = makeSut()

    const apiErrorResponse = sut(mockId)
    const expectedError = new Errors.InternalServerError().message

    await expect(apiErrorResponse).rejects.toThrow(expectedError)
  })
})
