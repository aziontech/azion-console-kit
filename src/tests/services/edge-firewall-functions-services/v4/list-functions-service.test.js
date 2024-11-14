import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listFunctionsService } from '@/services/edge-firewall-functions-services/v4'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const API_VERSION = 'v4'
const EDGE_FIREWALL_ID = 123

const fixtures = {
  functionsInstance: {
    name: 'function instance name',
    json_args: {},
    edge_function: 321,
    id: 123,
    initiator_type: 'teste',
    last_modified: new Date(2023, 10, 10),
    last_editor: 'az editor'
  },
  functionInstanceWithVersion: {
    version: 2,
    vendor: 3,
    name: 'function instance version',
    json_args: {},
    edge_function: 321,
    id: 123,
    initiator_type: 'teste',
    last_modified: new Date(2023, 10, 10),
    last_editor: 'az editor'
  }
}

const makeSut = () => {
  const sut = listFunctionsService
  return { sut }
}

describe('EdgeFirewallFunctionsServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  vi.restoreAllMocks()

  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      count: 0,
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({ edgeFirewallID: EDGE_FIREWALL_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_firewall/firewalls/123/functions?ordering=&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should correctly parse all returned edge firewall function instances', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      count: 2,
      statusCode: 200,
      body: { results: [fixtures.functionsInstance, fixtures.functionInstanceWithVersion] }
    })
    const { sut } = makeSut()

    const result = await sut({ id: EDGE_FIREWALL_ID })

    expect(result).toEqual([
      {
        args: fixtures.functionsInstance.json_args,
        edgeFunctionId: fixtures.functionsInstance.edge_function,
        id: fixtures.functionsInstance.id,
        lastEditor: fixtures.functionsInstance.last_editor,
        lastModified: fixtures.functionsInstance.last_modified,
        name: fixtures.functionsInstance.name
      },
      {
        args: fixtures.functionInstanceWithVersion.json_args,
        edgeFunctionId: fixtures.functionInstanceWithVersion.edge_function,
        id: fixtures.functionInstanceWithVersion.id,
        lastEditor: fixtures.functionInstanceWithVersion.last_editor,
        lastModified: fixtures.functionInstanceWithVersion.last_modified,
        name: fixtures.functionInstanceWithVersion.name
      }
    ])
  })

  it('should call the API with custom query parameters.', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      count: 0,
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({
      edgeFirewallID: EDGE_FIREWALL_ID,
      ordering: 'name',
      sort: 'desc',
      page: 2,
      pageSize: 50
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_firewall/firewalls/123/functions?ordering=name&page=2&page_size=50&fields=&search=`,
      method: 'GET'
    })
  })

  it('should correctly handle an empty response.', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallID: EDGE_FIREWALL_ID })

    expect(result).toEqual([])
  })

  it('should correctly handle null json_args.', async () => {
    const functionWithNullArgs = { ...fixtures.functionsInstance, json_args: null }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      count: 1,
      statusCode: 200,
      body: { results: [functionWithNullArgs] }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallID: EDGE_FIREWALL_ID })
    expect(result[0].args).toBeNull()
  })

  it('should throw an error if the request fails.', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(new Error('Erro de rede'))
    const { sut } = makeSut()

    await expect(sut({ edgeFirewallID: EDGE_FIREWALL_ID })).rejects.toThrow('Erro de rede')
  })
})
