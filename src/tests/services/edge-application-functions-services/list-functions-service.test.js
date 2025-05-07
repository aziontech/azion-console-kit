import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listFunctionsService } from '@/services/edge-application-functions-services'
import { describe, expect, it, vi } from 'vitest'

const API_VERSION = 'v3'
const EDGE_APPLICATION_ID = 123

const fixtures = {
  functionsInstance: {
    name: 'function instance name',
    args: {},
    edge_function_id: 321,
    id: '123'
  },
  functionInstanceWithVersion: {
    version: 2,
    vendor: 3,
    name: 'function instance version',
    args: {},
    edge_function_id: 321,
    id: '123'
  }
}

const makeSut = () => {
  const sut = listFunctionsService
  return { sut }
}

describe('EdgeApplicationFunctionsServices', () => {
  vi.restoreAllMocks()

  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({ id: EDGE_APPLICATION_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_applications/${EDGE_APPLICATION_ID}/functions_instances?order_by=id&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should correctly parse all returned edge application function instances', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.functionsInstance, fixtures.functionInstanceWithVersion] }
    })
    const { sut } = makeSut()

    const result = await sut({ id: EDGE_APPLICATION_ID })

    expect(result).toEqual([
      {
        name: {
          tagProps: {},
          text: 'function instance name'
        },
        args: fixtures.functionsInstance.args,
        edgeFunctionId: fixtures.functionsInstance.edge_function_id,
        id: fixtures.functionsInstance.id
      },
      {
        name: {
          tagProps: {
            icon: 'pi pi-cart-plus',
            value: 'Integration',
            outlined: true,
            severity: 'info'
          },
          text: 'function instance version'
        },
        args: fixtures.functionInstanceWithVersion.args,
        edgeFunctionId: fixtures.functionInstanceWithVersion.edge_function_id,
        id: fixtures.functionInstanceWithVersion.id
      }
    ])
  })
})
