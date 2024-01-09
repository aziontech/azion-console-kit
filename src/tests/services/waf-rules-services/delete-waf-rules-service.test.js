import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteWafRulesService } from '@/services/waf-rules-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteWafRulesService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const wafRuleIdMock = 765678
    const { sut } = makeSut()
    const version = 'v3'
    await sut(wafRuleIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/waf/rulesets/${wafRuleIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const wafRuleIdMock = 7816825367
    const { sut } = makeSut()

    const feedbackMessage = await sut(wafRuleIdMock)

    expect(feedbackMessage).toBe('Waf rule successfully deleted')
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

      const response = sut(wafRuleIdMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
