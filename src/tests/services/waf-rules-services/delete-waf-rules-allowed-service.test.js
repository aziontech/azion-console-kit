import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteWafRulesAllowedService } from '@/services/waf-rules-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteWafRulesAllowedService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const wafRuleIdMock = 765678
    const { sut } = makeSut()
    await sut({ wafId: wafRuleIdMock, allowedId: 10 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/wafs/765678/exceptions/10`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const wafRuleIdMock = 7816825367
    const { sut } = makeSut()

    const feedbackMessage = await sut({ wafId: wafRuleIdMock, allowedId: 10 })

    expect(feedbackMessage).toBe('WAF allowed rule successfully deleted')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.NotFoundError().message
    },
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
      const wafRuleIdMock = 7816825367
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut({ wafId: wafRuleIdMock, allowedId: 10 })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
