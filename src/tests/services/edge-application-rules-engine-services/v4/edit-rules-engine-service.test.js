import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editRulesEngineService } from '@/services/edge-application-rules-engine-services/v4'
import { describe, expect, it, vi } from 'vitest'
import { adaptCriteria } from '@/services/edge-application-rules-engine-services/v4/helper-criteria'

const fixtures = {
  ruleEngineMock: {
    id: '123456',
    name: 'Rule Test',
    phase: {
      content: 'request'
    },
    behaviors: [
      {
        name: 'redirect',
        target: 'https://example.com'
      }
    ],
    criteria: [
      [
        {
          variable: 'remote_addr',
          operator: 'is_equal',
          value: '127.0.0.1'
        }
      ]
    ],
    isActive: true,
    description: 'Test rule description'
  }
}

const makeSut = () => {
  const sut = editRulesEngineService
  return { sut }
}

describe('EdgeApplicationRulesEngineServices', () => {
  it('should call API with correct params when editing a rule', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()
    const applicationId = '987654'

    await sut({ id: applicationId, payload: fixtures.ruleEngineMock })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${applicationId}/rules/${fixtures.ruleEngineMock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.ruleEngineMock.name,
        phase: fixtures.ruleEngineMock.phase.content,
        behaviors: [
          {
            name: 'redirect',
            argument: 'https://example.com'
          }
        ],
        criteria: fixtures.ruleEngineMock.criteria,
        active: fixtures.ruleEngineMock.isActive,
        description: fixtures.ruleEngineMock.description
      }
    })
  })

  it('should call API with correct params when reordering a rule', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()
    const applicationId = '987654'
    const reorderPayload = {
      id: '123456',
      order: '2'
    }

    await sut({ id: applicationId, payload: reorderPayload, reorder: true })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${applicationId}/rules/${reorderPayload.id}`,
      method: 'PATCH',
      body: {
        order: 2
      }
    })
  })

  it('should return success feedback when rule is edited', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const result = await sut({ id: '987654', payload: fixtures.ruleEngineMock })

    expect(result).toBe('Rule successfully updated')
  })

  it('should throw internal server error when request fails with 500', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { detail: 'Internal Server Error' }
    })
    const { sut } = makeSut()

    const promise = sut({ id: '987654', payload: fixtures.ruleEngineMock })
    const expectedError = new Errors.InternalServerError().message

    expect(promise).rejects.toBe(expectedError)
  })

  it('should throw API error when request fails with other status', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'Bad Request Error' }
    })
    const { sut } = makeSut()

    const promise = sut({ id: '987654', payload: fixtures.ruleEngineMock })

    expect(promise).rejects.toBe('Bad Request Error')
  })

  it('should remove argument from criteria when operator is "exists" or "does_not_exist"', () => {
    const criterias = [
      [
        {
          variable: 'remote_addr',
          operator: 'exists',
          argument: '192.168.1.1'
        },
        {
          variable: 'remote_addr',
          operator: 'is_equal',
          argument: '192.168.1.1'
        }
      ]
    ]

    const expectedCriterias = [
      [
        {
          variable: 'remote_addr',
          operator: 'exists'
        },
        {
          variable: 'remote_addr',
          operator: 'is_equal',
          argument: '192.168.1.1'
        }
      ]
    ]

    const result = adaptCriteria(criterias)

    expect(result).toEqual(expectedCriterias)
  })
})
