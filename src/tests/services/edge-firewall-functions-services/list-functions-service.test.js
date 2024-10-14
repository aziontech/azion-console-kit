import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFunctionsService } from '@/services/edge-firewall-functions-services'
import { describe, expect, it, vi } from 'vitest'

// Constantes para reutilização
const API_VERSION = 'v3'
const EDGE_FIREWALL_ID = 123

const fixtures = {
  functionsInstance: {
    name: 'function instance name',
    json_args: {},
    edge_function_id: 321,
    id: 123,
    initiator_type: 'teste'
  },
  functionInstanceWithVersion: {
    version: 2,
    vendor: 3,
    name: 'function instance version',
    json_args: {},
    edge_function_id: 321,
    id: 123,
    initiator_type: 'teste'
  }
}

const makeSut = () => {
  const sut = listEdgeFunctionsService
  return { sut }
}

describe('EdgeFirewallFunctionsServices', () => {
  vi.restoreAllMocks()

  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({ id: EDGE_FIREWALL_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_functions?order_by=id&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should correctly parse all returned edge firewall function instances', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.functionsInstance, fixtures.functionInstanceWithVersion] }
    })
    const { sut } = makeSut()

    const result = await sut({ id: EDGE_FIREWALL_ID })

    expect(result).toEqual([
      {
        label: 'function instance name',
        value: fixtures.functionsInstance.id,
        args: '{}',
        id: fixtures.functionsInstance.id,
        initiatorType: fixtures.functionsInstance.initiator_type
      },
      {
        label: 'function instance version',
        value: fixtures.functionInstanceWithVersion.id,
        args: '{}',
        id: fixtures.functionInstanceWithVersion.id,
        initiatorType: fixtures.functionInstanceWithVersion.initiator_type
      }
    ])
  })

  it('should call the API with custom query parameters.', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({ orderBy: 'name', sort: 'desc', page: 2, pageSize: 50 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_functions?order_by=name&sort=desc&page=2&page_size=50`,
      method: 'GET'
    })
  })

  it('should correctly handle an empty response.', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    const result = await sut({ id: EDGE_FIREWALL_ID })

    expect(result).toEqual([])
  })

  it('should correctly handle null json_args.', async () => {
    const functionWithNullArgs = { ...fixtures.functionsInstance, json_args: null }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [functionWithNullArgs] }
    })
    const { sut } = makeSut()

    const result = await sut({ id: EDGE_FIREWALL_ID })

    expect(result[0].args).toBe('null')
  })

  it('should throw an error if the request fails.', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(new Error('Erro de rede'))
    const { sut } = makeSut()

    await expect(sut({ id: EDGE_FIREWALL_ID })).rejects.toThrow('Erro de rede')
  })
})
