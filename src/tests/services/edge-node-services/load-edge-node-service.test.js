import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeNodeService } from '@/services/edge-node-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: 76789,
    active: true,
    groups: [],
    name: 'My Edge Service',
    has_services: true
  }
}

const makeSut = () => {
  const sut = loadEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })
    const dnsIdMock = 76789
    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: dnsIdMock })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_nodes/${dnsIdMock}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned edge node', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mock
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.mock.id })

    expect(result).toEqual({
      name: fixtures.mock.name,
      groups: fixtures.mock.groups,
      hashId: fixtures.mock.hashId,
      id: fixtures.mock.id,
      hasServices: fixtures.mock.has_services
    })
  })
})
