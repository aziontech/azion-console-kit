import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeApplicationFunctionsService } from '@/services/edge-application-functions-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  functionsInstance: {
    id: 1,
    name: 'function instance',
    edgeFunctionId: 123,
    edge_function_id: 123,
    last_editor: 'az editor instance',
    last_modified: new Date(2023, 10, 10),
  },
  edgeFunctionMock: {
    active: true,
    version: '1.0.0',
    language: 'javascript',
    initiator_type: 'Initiator',
    id: 1239875,
    last_editor: 'az editor',
    modified: new Date(2023, 10, 10),
    name: 'AZ firewall',
    reference_count: '2',
    vendor: 'Azion'
  }
}

const makeSut = () => {
  const sut = listEdgeApplicationFunctionsService

  return {
    sut
  }
}

describe('EdgeApplicationFunctionsServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should correctly parse all returned edge applications functions', async () => {
    localeMock()
    const spy = vi.spyOn(AxiosHttpClientAdapter, 'request')

    spy.mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.functionsInstance] }
    })

    spy.mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.edgeFunctionMock }
    })
    const { sut } = makeSut()

    const edgeApplicationId = 123
    const result = await sut({ id: edgeApplicationId })

    expect(result).toEqual([
      {
        id: '1',
        name: { text: 'function instance', tagProps: {} },
        functionInstanced: 'AZ firewall',
        lastEditor: 'az editor instance',
        modified: 'Friday, November 10, 2023 at 12:00:00 AM',
        version: '1.0.0'
      }
    ])
  })
})
