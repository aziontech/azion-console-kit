import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editWafRulesAllowedService } from '@/services/waf-rules-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    matchZones: [{ matches_on: null, zone: 'path', zone_input: null }],
    path: '/tmp',
    ruleId: 0,
    reason: 'test',
    status: false,
    useRegex: false
  }
}

const makeSut = () => {
  const sut = editWafRulesAllowedService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: fixtures.wafRulesMock
    })
    const { sut } = makeSut()
    await sut({ payload: fixtures.wafRulesMock, wafId: 4040, allowedId: 10 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge/wafs/4040/allowed_rules/10',
      method: 'PUT',
      body: {
        match_zones: fixtures.wafRulesMock.matchZones,
        path: fixtures.wafRulesMock.path,
        description: fixtures.wafRulesMock.reason,
        rule_id: fixtures.wafRulesMock.ruleId,
        status: fixtures.wafRulesMock.status,
        use_regex: fixtures.wafRulesMock.useRegex
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: fixtures.wafRulesMock
    })
    const { sut } = makeSut()

    const data = await sut({ payload: fixtures.wafRulesMock, wafId: 4040, allowedId: 10 })

    expect(data).toStrictEqual('Your waf rule allowed has been updated')
  })

  it('Should return an API error for an 400 response status', async () => {
    const apiErrorMock = 'This field is required.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        detail: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut({ payload: fixtures.wafRulesMock, wafId: 4040, allowedId: 10 })

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
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

      const response = sut({ payload: fixtures.wafRulesMock, wafId: 4040, allowedId: 10 })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
