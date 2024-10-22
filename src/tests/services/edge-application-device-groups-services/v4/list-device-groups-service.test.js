import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDeviceGroupsService } from '@/services/edge-application-device-groups-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  deviceGroupSample: {
    id: '123',
    name: 'teste',
    user_agent: '*'
  }
}

const makeSut = () => {
  const sut = listDeviceGroupsService

  return { sut }
}

describe('EdgeApplicationDeviceGroupsServicesV4', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const version = 'v4'
    await sut({ id: edgeApplicationId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_application/applications/${edgeApplicationId}/device_groups?ordering=name&page=1&page_size=200&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.deviceGroupSample]
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const result = await sut({ id: edgeApplicationId })

    expect(result).toEqual([
      {
        id: fixtures.deviceGroupSample.id,
        deviceId: {
          content: fixtures.deviceGroupSample.id
        },
        name: fixtures.deviceGroupSample.name,
        userAgent: fixtures.deviceGroupSample.user_agent
      }
    ])
  })

  it('should return empty array when there is no device group', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: []
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const result = await sut({ id: edgeApplicationId })
    expect(result).toHaveLength(0)
  })
})
