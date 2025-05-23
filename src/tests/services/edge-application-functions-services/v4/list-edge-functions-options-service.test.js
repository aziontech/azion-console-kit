import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listFunctionsServiceOptions } from '@/services/edge-application-functions-services/v4'
import { describe, expect, it, vi } from 'vitest'

const API_VERSION = 'v4'
const EDGE_APPLICATION_ID = 123

const query = {
  page: 1,
  pageSize: 30,
  search: 'test01'
}

const fixtures = {
  functionsInstance: {
    name: 'function instance name',
    json_args: {},
    edge_function: 321,
    id: 123,
    initiator_type: 'teste'
  }
}

const makeSut = () => {
  const sut = listFunctionsServiceOptions
  return { sut }
}

describe('EdgeApplicationFunctionsServices', () => {
  vi.restoreAllMocks()

  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] },
      count: 0
    })
    const { sut } = makeSut()

    await sut({ id: EDGE_APPLICATION_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_application/applications/123/functions?ordering=name&page=1&page_size=100&fields=&search=`,
      method: 'GET'
    })
  })

  it('should call API with correct search params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] },
      count: 0
    })
    const { sut } = makeSut()

    await sut({ id: EDGE_APPLICATION_ID, ...query })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_application/applications/123/functions?ordering=name&page=1&page_size=30&fields=&search=test01`,
      method: 'GET'
    })
  })

  it('should correctly parse all returned edge firewall function instances', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.functionsInstance] },
      count: 1
    })
    const { sut } = makeSut()

    const result = await sut({ id: EDGE_APPLICATION_ID })

    expect(result).toEqual([
      {
        id: fixtures.functionsInstance.id.toString(),
        name: fixtures.functionsInstance.name
      }
    ])
  })
})
