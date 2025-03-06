import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallId: '123',
  payload: {
    name: 'Rules Engine teste',
    description: 'My description',
    active: true,
    criteria: [
      [{ conditional: 'if', input: '${uri}', comparison: 'starts_with', subject: '/api' }]
    ],
    behaviors: [
      { name: 'run_function', functionId: 'abc123' },
      { name: 'set_waf_ruleset', mode: 'blocking', waf_id: 'def456' },
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
        content_body: 'Not Access'
      }
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
      statusCode: 202
    })

    const { sut } = makeSut()

    await sut(fixtures)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/edge_firewall/firewalls/${fixtures.edgeFirewallId}/rules`,
      body: {
        name: fixtures.payload.name,
        description: fixtures.payload.description,
        active: fixtures.payload.active,
        criteria: fixtures.payload.criteria,
        behaviors: [
          { name: 'run_function', argument: 'abc123' },
          {
            name: 'set_waf_ruleset',
            argument: { mode: 'blocking', id: 'def456' }
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
            argument: { status_code: 403, content_type: 'text/plain', content_body: 'Not Access' }
          }
        ]
      }
    })
  })

  it('should return a feedback message when successfully created.', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures)

    expect(feedback).toBe('Rule Engine successfully created')
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures)

    await expect(apiErrorResponse).rejects.toThrow('error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures)
    const expectedError = new Errors.InternalServerError().message

    await expect(apiErrorResponse).rejects.toThrow(expectedError)
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
