import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createWafRulesAllowedTuningService } from '@/services/waf-rules-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  name: `Allowed Rules
created to
allow the
attack`,
  expectName: 'Allowed Rules created to allow the attack',
  wafRulesMock: [
    {
      hitCount: 3,
      topIps: ['201.149.110.60'],
      id: 0,
      ruleId: 1010,
      ipCount: 1,
      matchZone: 'cookie',
      pathCount: 1,
      topCountries: ['Brazil'],
      matchesOn: 'value',
      countryCount: 1,
      topPaths: ['/get'],
      matchValue: 'arg'
    },
    {
      hitCount: 3,
      topIps: ['201.149.110.60'],
      id: 1,
      ruleId: 1011,
      ipCount: 1,
      matchZone: 'path',
      pathCount: 1,
      topCountries: ['Brazil'],
      matchesOn: 'value',
      countryCount: 1,
      topPaths: ['/get']
    },
    {
      hitCount: 3,
      topIps: ['201.149.110.60'],
      id: 1,
      ruleId: 1011,
      ipCount: 1,
      matchZone: 'path',
      pathCount: 1,
      topCountries: ['Brazil'],
      matchesOn: 'value',
      countryCount: 1,
      topPaths: ['/get'],
      matchValue: 'arg'
    },
    {
      hitCount: 3,
      topIps: ['201.149.110.60'],
      id: 1,
      ruleId: 1011,
      ipCount: 1,
      matchZone: 'router',
      pathCount: 1,
      topCountries: ['Brazil'],
      matchesOn: 'value',
      countryCount: 1,
      topPaths: ['/get'],
      matchValue: 'arg'
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
  it('should call API with correct params - cookie case', async () => {
    const bodyRequest = [fixtures.wafRulesMock[0]]
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: bodyRequest
    })
    const { sut } = makeSut()
    await sut({ attackEvents: bodyRequest, wafId: 10, name: fixtures.name })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge_firewall/wafs/10/exceptions',
      method: 'POST',
      body: {
        rule_id: fixtures.wafRulesMock[0].ruleId,
        name: fixtures.expectName,
        match_zones: [
          {
            matches_on: 'value',
            zone: 'conditional_request_header',
            zone_input: 'cookie'
          }
        ]
      }
    })
  })

  it('should call API with correct params - path case', async () => {
    const bodyRequest = [fixtures.wafRulesMock[1]]
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: bodyRequest
    })
    const { sut } = makeSut()
    await sut({ attackEvents: bodyRequest, wafId: 10, name: fixtures.name })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge_firewall/wafs/10/exceptions',
      method: 'POST',
      body: {
        rule_id: fixtures.wafRulesMock[1].ruleId,
        name: fixtures.expectName,
        match_zones: [
          {
            matches_on: 'value',
            zone: 'path'
          }
        ]
      }
    })
  })

  it('should call API with correct params - without matchZone', async () => {
    const bodyRequest = [fixtures.wafRulesMock[3]]
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: bodyRequest
    })
    const { sut } = makeSut()
    await sut({ attackEvents: bodyRequest, wafId: 10, name: fixtures.name })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge_firewall/wafs/10/exceptions',
      method: 'POST',
      body: {
        rule_id: fixtures.wafRulesMock[3].ruleId,
        name: fixtures.expectName,
        match_zones: [
          {
            matches_on: 'value',
            zone: 'conditional_request_header',
            zone_input: 'arg'
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

    const data = await sut({
      attackEvents: bodyRequest,
      wafId: 10,
      name: fixtures.name
    })

    const expectedReturn = [
      {
        status: 'fulfilled',
        value: 'Your waf rule allowed has been created'
      }
    ]

    expect(data).toStrictEqual(expectedReturn)
  })

  it.each([
    {
      statusCode: 400,
      error: {
        detail: [{ error: ['This field is required.'] }]
      },
      expectedError: 'error: This field is required.'
    },
    {
      statusCode: 400,
      error: {
        detail: 'This name field is required'
      },
      expectedError: 'detail: This name field is required'
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError, error }) => {
      const bodyRequest = [fixtures.wafRulesMock[0]]

      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
        statusCode,
        body: error
      })
      const { sut } = makeSut()

      const responses = await sut({
        attackEvents: bodyRequest,
        id: 10,
        name: fixtures.name
      })

      expect(responses).toEqual([
        {
          reason: expectedError,
          status: 'rejected'
        }
      ])
    }
  )

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

      const responses = await sut({
        attackEvents: bodyRequest,
        id: 10,
        name: fixtures.name
      })

      responses.forEach(({ reason, status }) => {
        if (status === 'rejected') {
          expect(status).toBe('rejected')
          expect(reason).toBe(expectedError)
        }
      })
    }
  )
})
