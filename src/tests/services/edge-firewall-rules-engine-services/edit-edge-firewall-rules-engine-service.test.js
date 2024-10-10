import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    edgeFirewallId: '123',
    payload: {
      id: '456',
      name: 'Test Rule',
      description: 'Test Description',
      active: true,
      criteria: [
        { conditional: 'if', input: 'hostname', comparison: 'is_equal', subject: 'example.com' }
      ],
      behaviors: [
        { name: 'run_function', functionId: '789' },
        { name: 'set_waf_ruleset_and_waf_mode', mode: 'blocking', waf_id: '101112' },
        {
          name: 'set_rate_limit',
          type: 'second',
          limit_by: 'ip',
          average_rate_limit: 10,
          maximum_burst_size: 20
        },
        {
          name: 'set_custom_response',
          status_code: 403,
          content_type: 'text/plain',
          content_body: 'Forbidden'
        },
        { name: 'deny' }
      ]
    }
  }
}

const makeSut = () => {
  const sut = editEdgeFirewallRulesEngineService

  return {
    sut
  }
}

describe('EdgeFirewallRulesEngineServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_firewall/${fixtures.mock.edgeFirewallId}/rules_engine/${fixtures.mock.payload.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.mock.payload.name,
        description: fixtures.mock.payload.description,
        is_active: fixtures.mock.payload.active,
        criteria: fixtures.mock.payload.criteria,
        behaviors: [
          { name: 'run_function', argument: '789' },
          {
            name: 'set_waf_ruleset_and_waf_mode',
            argument: { waf_mode: 'blocking', set_waf_ruleset_and_waf_mode: '101112' }
          },
          {
            name: 'set_rate_limit',
            argument: {
              type: 'second',
              limit_by: 'ip',
              average_rate_limit: '10',
              maximum_burst_size: '20'
            }
          },
          {
            name: 'set_custom_response',
            argument: { status_code: 403, content_type: 'text/plain', content_body: 'Forbidden' }
          },
          { name: 'deny' }
        ]
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mock)

    expect(feedbackMessage).toBe('Rule Engine successfully updated')
  })

  it('should throw an error if the API returns a validation error', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { name: { invalid_value: 'Test' } }
    })

    const { sut } = makeSut()
    const promise = sut(fixtures.mock)

    await expect(promise).rejects.toBe(
      'invalid_value:Test is an invalid value. Please modify it and try again.'
    )
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

      const response = sut(fixtures.mock)

      await expect(response).rejects.toBe(expectedError)
    }
  )
})
