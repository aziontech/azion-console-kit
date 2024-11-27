import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadDeviceGroupService } from '@/services/edge-application-device-groups-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: '1234',
  deviceGroupSample: {
    id: '123',
    name: 'teste',
    user_agent: '*'
  }
}
const makeSut = () => {
  const sut = loadDeviceGroupService

  return {
    sut
  }
}

describe('EdgeApplicationDeviceGroupsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: {} }
    })

    const { sut } = makeSut()
    await sut({ edgeApplicationId: fixtures.edgeApplicationId, id: fixtures.deviceGroupSample.id })
    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.edgeApplicationId}/device_groups/${fixtures.deviceGroupSample.id}`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.deviceGroupSample }
    })

    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      id: fixtures.deviceGroupSample.id,
      name: fixtures.deviceGroupSample.name,
      userAgent: fixtures.deviceGroupSample.user_agent
    })
  })

  it('should throw an error if status code is not 200', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'error' }
    })

    const { sut } = makeSut()
    await expect(sut({})).rejects.toThrow('error')
  })
})
