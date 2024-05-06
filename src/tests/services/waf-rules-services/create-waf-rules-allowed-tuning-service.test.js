import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createWafRulesAllowedTuningService } from '@/services/waf-rules-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  reason: 'Allowed Rules created to allow the attack',
  wafRulesMock: [
    {
      hitCount: 3,
      topIps: [
          "201.149.110.60"
      ],
      id: 0,
      ruleId: 1010,
      ipCount: 1,
      matchZone: "query_string",
      pathCount: 1,
      topCountries: [
          "Brazil"
      ],
      matchesOn: "value",
      countryCount: 1,
      topPaths: [
          "/get"
      ],
      matchValue: "arg"
    },
    {
      hitCount: 3,
      topIps: [
          "201.149.110.60"
      ],
      id: 1,
      ruleId: 1011,
      ipCount: 1,
      matchZone: "path",
      pathCount: 1,
      topCountries: [
          "Brazil"
      ],
      matchesOn: "value",
      countryCount: 1,
      topPaths: [
          "/get"
      ],
      matchValue: "arg"
    }
  ]
}

const makeSut = () => {
  const sut = createWafRulesAllowedTuningService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should call API with correct params', async () => {
    const bodyRequest = [fixtures.wafRulesMock[0]] 
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: bodyRequest
    })
    const { sut } = makeSut()
    await sut({ attackEvents: bodyRequest, wafId: 10, reason: fixtures.reason })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge/waf/10/allowed_rules',
      method: 'POST',
      body: {
        rule_id: fixtures.wafRulesMock[0].ruleId,
        reason: fixtures.reason,
        match_zones: [ 
          {
            matches_on: "value",
            zone: "conditional_query_string",
            zone_input: "arg",
          }
        ]
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    const bodyRequest = [fixtures.wafRulesMock[1]]
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: bodyRequest
    })
    const { sut } = makeSut()

    const data = await sut({ attackEvents: bodyRequest, wafId: 10, reason: fixtures.reason })

    const expectedReturn = [
        {
          status: "fulfilled",
          value: "Your waf rule allowed has been created",
        }
      ]

    expect(data).toStrictEqual(expectedReturn)
  })

  it('Should return an API error for an 400 response status', async () => {
    const errorKey = 'detail'
    const apiErrorMock = 'This field is required.'
    const expectedErroMessage = [
    {
      reason: "error: This field is required.",
      status: "rejected",
    },
    {
      reason: "detail: This name field is required",
      status: "rejected",
    }]

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [{ error: [apiErrorMock] }]
      }
    })
    .mockResolvedValue({
      statusCode: 400,
      body: {
        [errorKey]: "This name field is required"
      }
    })

    const { sut } = makeSut()

    const reason = await sut({ attackEvents: fixtures.wafRulesMock, wafId: 1, reason: fixtures.reason })

    expect(reason).toEqual(expectedErroMessage)
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

      const bodyRequest = [fixtures.wafRulesMock[0]] 

      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
        statusCode
      })
      const { sut } = makeSut()

      const responses = await sut({ attackEvents: bodyRequest, id: 10, reason: fixtures.reason })

      responses.forEach(({reason, status}) => {
        if(status === 'rejected') {
          expect(status).toBe('rejected')
          expect(reason).toBe(expectedError)
        }
      })
    }
  )
})
