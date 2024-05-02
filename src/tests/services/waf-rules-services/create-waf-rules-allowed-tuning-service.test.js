import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createWafRulesAllowedTuningService } from '@/services/waf-rules-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    reason: 'Allowed Rules created to allow the attack',
    matchZone: [
      {
        zone: 'conditional_query_string',
        zoneInput: 'arg',
        matchesOn: 'value'
      }
    ],
    ruleId: '1000'
  }
}

const makeSut = () => {
  const sut = createWafRulesAllowedTuningService

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
    await sut({ payload: fixtures.wafRulesMock, wafId: 10 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge/waf/10/allowed_rules',
      method: 'POST',
      body: {
        rule_id: fixtures.wafRulesMock.ruleId,
        match_zones: [{
          matches_on: fixtures.wafRulesMock.matchZone[0].matchesOn,
          zone: fixtures.wafRulesMock.matchZone[0].zone,
          zone_input: fixtures.wafRulesMock.matchZone[0].zoneInput,
        }],
        reason: fixtures.wafRulesMock.reason
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: fixtures.wafRulesMock
    })
    const { sut } = makeSut()

    const data = await sut({ payload: fixtures.wafRulesMock, wafId: 10 })

    expect(data).toStrictEqual('Your waf rule allowed has been created')
  })

  it('Should return an API error for an 400 response status', async () => {
    const errorKey = 'detail'
    const apiErrorMock = 'This field is required.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [{ error: [apiErrorMock] }]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut({ payload: fixtures.wafRulesMock, wafId: 10 })

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

      const response = sut({ payload: fixtures.wafRulesMock, id: 10 })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
