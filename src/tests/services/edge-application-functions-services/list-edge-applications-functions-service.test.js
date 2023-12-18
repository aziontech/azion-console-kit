import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listFunctionsService } from '@/services/edge-application-functions-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  functionsInstance: {
    name: 'function instance name',
    args: {},
    edge_function_id: 321,
    id: 123
  }
}

const makeSut = () => {
  const sut = listFunctionsService

  return {
    sut
  }
}

describe('EdgeApplicationFunctionsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()
    const version = 'v3'
    const edgeApplicationId = 123
    await sut({ id: edgeApplicationId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${edgeApplicationId}/functions_instances?order_by=id&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned edge applications', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.functionsInstance] }
    })
    const { sut } = makeSut()

    const edgeApplicationId = 123
    const result = await sut({ id: edgeApplicationId })

    expect(result).toEqual([
      {
        name: {
          tagProps: {},
          text: 'function instance name'
        },
        args: fixtures.functionsInstance.args,
        edgeFunctionId: fixtures.functionsInstance.edge_function_id,
        id: fixtures.functionsInstance.id
      }
    ])
  })
})
