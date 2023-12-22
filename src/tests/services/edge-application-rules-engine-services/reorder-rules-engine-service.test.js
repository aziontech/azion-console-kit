import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { reorderRulesEngine } from '@/services/edge-application-rules-engine-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  ruleData: [
    {
      oldIndex: 3,
      newIndex: 4,
      id: 353623,
      name: 'teste 2',
      phase: {
        content: 'Request',
        outlined: true,
        severity: 'info'
      },
      behaviors: [
        {
          name: 'no_content',
          target: null
        }
      ],
      criteria: [
        [
          {
            variable: '${uri}',
            operator: 'is_not_equal',
            conditional: 'if',
            input_value: '2'
          }
        ]
      ],
      status: {
        content: 'Active',
        severity: 'success'
      },
      order: 5,
      description: 'terste'
    }
  ],
  defaultRuleData: {
    oldIndex: 4,
    newIndex: 5,
    id: 353623,
    name: 'Default Rule Engine',
    phase: {
      content: 'Default',
      outlined: true,
      severity: 'info'
    },
    behaviors: [
      {
        name: 'no_content',
        target: null
      }
    ],
    criteria: [
      [
        {
          variable: '${uri}',
          operator: 'is_not_equal',
          conditional: 'if',
          input_value: '2'
        }
      ]
    ],
    status: {
      content: 'Active',
      severity: 'success'
    },
    order: 5,
    description: 'terste'
  }
}

const makeSut = () => {
  const sut = reorderRulesEngine

  return { sut }
}

describe('EdgeApplicationRulesEnginesServices', () => {
  it('should reorder valid rule engine', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const version = 'v3'
    const edgeApplicationId = 123
    const phaseRules = 'request'
    await sut(fixtures.ruleData, edgeApplicationId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${edgeApplicationId}/rules_engine/${phaseRules}/rules/${fixtures.ruleData[0].id}`,
      method: 'PATCH',
      body: {
        order: fixtures.ruleData[0].newIndex + 1
      }
    })
  })

  it('should not reorder invalid rule engine', async () => {
    const { sut } = makeSut()

    const edgeApplicationId = 123
    const reorderService = sut([fixtures.defaultRuleData], edgeApplicationId)
    const errorMessage = new Errors.CannotReorderDefaultRule().message

    expect(reorderService).rejects.toBe(errorMessage)
  })
})
