import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFunctionsDropdownService } from '@/services/edge-functions-services/v4'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const API_VERSION = 'v4'

const fixtures = {
  edgeFunction: {
    id: 123,
    name: 'edge function name',
    initiator_type: 'edge_firewall'
  },
  edgeFunctionWithDifferentInitiator: {
    id: 456,
    name: 'another edge function',
    initiator_type: 'rules_engine'
  }
}

const makeSut = () => {
  const sut = listEdgeFunctionsDropdownService
  return { sut }
}

describe('EdgeFunctionsServices', () => {
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

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_functions/functions?ordering=&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should correctly parse all returned edge functions', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      count: 2,
      statusCode: 200,
      body: { results: [fixtures.edgeFunction, fixtures.edgeFunctionWithDifferentInitiator] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.edgeFunction.id,
        name: fixtures.edgeFunction.name
      },
      {
        id: fixtures.edgeFunctionWithDifferentInitiator.id,
        name: fixtures.edgeFunctionWithDifferentInitiator.name
      }
    ])
  })

  it('should filter edge functions by initiator_type when provided', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      count: 2,
      statusCode: 200,
      body: { results: [fixtures.edgeFunction, fixtures.edgeFunctionWithDifferentInitiator] }
    })
    const { sut } = makeSut()

    const result = await sut({ initiatorType: 'edge_firewall' })

    expect(result).toEqual([
      {
        id: fixtures.edgeFunction.id,
        name: fixtures.edgeFunction.name
      }
    ])
  })

  it('should call the API with custom query parameters', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      count: 0,
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({
      ordering: 'name',
      page: 2,
      pageSize: 50,
      fields: 'id,name',
      search: 'test'
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${API_VERSION}/edge_functions/functions?ordering=name&page=2&page_size=50&fields=id%2Cname&search=test`,
      method: 'GET'
    })
  })

  it('should correctly handle an empty response', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([])
  })

  it('should throw an error if the request fails', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(new Error('Network error'))
    const { sut } = makeSut()

    await expect(sut({})).rejects.toThrow('Network error')
  })
})