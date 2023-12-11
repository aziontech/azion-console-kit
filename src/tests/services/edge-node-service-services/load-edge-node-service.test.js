import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadServiceEdgeNodeService } from '@/services/edge-node-service-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mockIds: {
    id: 76789,
    serviceId: 1
  },
  mockResponse: {
    id: 17,
    service_name: 'service1',
    service_id: 9,
    variables: [
      {
        name: 'var1',
        value: 'value1'
      }
    ]
  }
}

const makeSut = () => {
  const sut = loadServiceEdgeNodeService

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
    const { sut } = makeSut()

    await sut(fixtures.mockIds)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_node/${fixtures.mockIds.id}/services/${fixtures.mockIds.serviceId}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned service edge node', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mockResponse
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.mockIds)

    expect(result).toEqual({
      id: fixtures.mockIds.id,
      service: {
        id: fixtures.mockResponse.id,
        name: fixtures.mockResponse.service_name,
        serviceId: fixtures.mockResponse.service_id
      },
      variables: 'var1=value1'
    })
  })
})
