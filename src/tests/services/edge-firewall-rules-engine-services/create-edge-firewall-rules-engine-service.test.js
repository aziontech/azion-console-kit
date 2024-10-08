import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services/create-edge-firewall-rules-engine-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallId: '123',
  payload: {
    name: 'Rules Engine teste',
    description: 'My description',
    active: true,
    criteria: [{ conditional: 'if', input: '${uri}', comparison: 'starts_with', subject: '/api' }],
    behaviors: [
      { name: 'run_function', functionId: 'abc123' },
      { name: 'set_waf_ruleset_and_waf_mode', mode: 'blocking', waf_id: 'def456' },
      { name: 'set_rate_limit', type: 'second', limit_by: 'ip', average_rate_limit: 10, maximum_burst_size: 20 },
      { name: 'set_custom_response', status_code: 403, content_type: 'text/plain', content_body: 'Not Access' }
    ]
  }
}

const makeSut = () => {
  const sut = createEdgeFirewallRulesEngineService

  return {
    sut
  }
}

describe('EdgeFirewallRulesEngineService', () => {
  it('should call the API with the correct parameters.', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()

    await sut(fixtures)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v3/edge_firewall/${fixtures.edgeFirewallId}/rules_engine`,
      body: {
        name: fixtures.payload.name,
        description: fixtures.payload.description,
        is_active: fixtures.payload.active,
        criteria: fixtures.payload.criteria,
        behaviors: [
          { name: 'run_function', argument: 'abc123' },
          { name: 'set_waf_ruleset_and_waf_mode', argument: { waf_mode: 'blocking', set_waf_ruleset_and_waf_mode: 'def456' } },
          { name: 'set_rate_limit', argument: { type: 'second', limit_by: 'ip', average_rate_limit: '10', maximum_burst_size: '20' } },
          { name: 'set_custom_response', argument: { status_code: 403, content_type: 'text/plain', content_body: 'Not Access' } }
        ]
      }
    })
  })

  it('should return a feedback message when successfully created.', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures)

    expect(feedback).toBe('Rule Engine successfully created')
  })

  it.each([
    {
      statusCode: 400,
      body: { name: { invalid: ' invalid name' } },
      expectedError: 'name: invalid name is an invalid value. Please modify it and try again.'
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
    'should throw an error when the request fails with the status code $statusCode',
    async ({ statusCode, body, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body
      })
      const { sut } = makeSut()

      const response = sut(fixtures)

      await expect(response).rejects.toBe(expectedError)
    }
  )
})