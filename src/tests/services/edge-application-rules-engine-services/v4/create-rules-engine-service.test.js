import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createRulesEngineService } from '@/services/edge-application-rules-engine-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  rulesEngineMock: {
    edgeApplicationId: 1234567890,
    name: 'Mock Rule',
    phase: 'default',
    active: true,
    behaviors: [
      {
        name: 'redirect',
        target: 'https://example.com'
      }
    ],
    criteria: [
      {
        entries: [
          {
            variable: 'remote_addr',
            operator: 'is_equal',
            value: '192.168.1.1'
          }
        ]
      }
    ],
    description: 'Mock rule description'
  }
}

const makeSut = () => {
  const sut = createRulesEngineService
  return { sut }
}

describe('EdgeApplicationRulesEngineService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    await sut(fixtures.rulesEngineMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.rulesEngineMock.edgeApplicationId}/rules`,
      method: 'POST',
      body: {
        name: fixtures.rulesEngineMock.name,
        phase: fixtures.rulesEngineMock.phase,
        active: fixtures.rulesEngineMock.active,
        behaviors: [
          {
            name: 'redirect',
            argument: 'https://example.com'
          }
        ],
        criteria: fixtures.rulesEngineMock.criteria,
        description: fixtures.rulesEngineMock.description
      }
    })
  })

  it('should return feedback when successfully creating a rule', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.rulesEngineMock)

    expect(result).toEqual({
      feedback: 'Rule successfully created'
    })
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { detail: 'Internal server error' }
    })
    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.rulesEngineMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })
    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.rulesEngineMock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })
})
