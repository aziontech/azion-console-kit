import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteWafRulesService } from '@/services/waf-rules-services/v4'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteWafRulesService

  return {
    sut
  }
}

const wafRuleIdMock = 123321

describe('WafRulesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()
    await sut(wafRuleIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/wafs/${wafRuleIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()

    const feedbackMessage = await sut(wafRuleIdMock)

    expect(feedbackMessage).toBe('WAF Rule successfully deleted')
  })

  it('Should return an API error for an 400 response status', async () => {
    const errorKey = 'detail'
    const apiErrorMock = 'This field is required.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(wafRuleIdMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it('should throw when request fails with status code 500', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })
    const { sut } = makeSut()

    const expectedError = new Errors.InternalServerError().message

    const response = sut(wafRuleIdMock)

    expect(response).rejects.toBe(expectedError)
  })
})
