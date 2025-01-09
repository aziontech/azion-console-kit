import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services/v4'

import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallId: '123',
  payload: {
    id: '456',
    name: 'Test Rule',
    description: 'Test Description',
    active: true,
    criteria: [
      [{ conditional: 'if', input: 'hostname', comparison: 'is_equal', subject: 'example.com' }]
    ],
    behaviors: [
      { name: 'run_function', functionId: '789' },
      { name: 'set_waf_ruleset', mode: 'blocking', waf_id: '101112' },
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

const makeSut = () => {
  const sut = editEdgeFirewallRulesEngineService

  return {
    sut
  }
}

describe('EdgeFirewallRulesEngineServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()
    await sut(fixtures)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/firewalls/${fixtures.edgeFirewallId}/rules/${fixtures.payload.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.payload.name,
        description: fixtures.payload.description,
        active: fixtures.payload.active,
        criteria: fixtures.payload.criteria,
        behaviors: [
          { name: 'run_function', argument: '789' },
          {
            name: 'set_waf_ruleset',
            argument: { mode: 'blocking', id: '101112' }
          },
          {
            name: 'set_rate_limit',
            argument: {
              type: 'second',
              limit_by: 'ip',
              average_rate_limit: 10,
              maximum_burst_size: 20
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
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures)

    expect(feedbackMessage).toBe('Rule Engine successfully updated')
  })

  it('should throw an error if the API returns a validation error', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { name: { invalid_value: 'Test' } }
    })

    const { sut } = makeSut()
    const promise = sut(fixtures)

    await expect(promise).rejects.toBe('Unknown error occurred')
  })

  it('should throw when request fails with status code 500', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })
    const { sut } = makeSut()

    const response = sut(fixtures)
    const expectedError = new Errors.InternalServerError().message
    await expect(response).rejects.toBe(expectedError)
  })

  it('should throw when request fails with status code 401', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 401,
      body: { detail: 'Invalid API token' }
    })
    const { sut } = makeSut()

    const response = sut(fixtures)
    await expect(response).rejects.toBe('Invalid API token')
  })

  it('should correctly convert the criteria variable to number and not modify other criteria', async () => {
    const originalCriteria = [
      {
        conditional: 'and',
        variable: '${network}',
        comparison: 'is_equal',
        argument: '10'
      },
      {
        conditional: 'or',
        variable: '${region}',
        comparison: 'is_not_equal',
        argument: 'us-east-1'
      }
    ]

    fixtures.payload.criteria = [originalCriteria]

    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()

    await sut(fixtures)

    const expectedCriteria = [
      {
        conditional: 'and',
        variable: '${network}',
        comparison: 'is_equal',
        argument: 10
      },
      {
        conditional: 'or',
        variable: '${region}',
        comparison: 'is_not_equal',
        argument: 'us-east-1'
      }
    ]

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          criteria: [expectedCriteria]
        })
      })
    )
  })
})
