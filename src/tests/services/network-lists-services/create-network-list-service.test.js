import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createNetworkListService } from '@/services/network-lists-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  networkMock: {
    name: 'teste',
    networkListType: 'ip_cidr',
    networkContentList: ['123.123.123.123']
  }
}

const makeSut = () => {
  const sut = createNetworkListService

  return {
    sut
  }
}

describe('NetworkListsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.networkMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `network_lists`,
      method: 'POST',
      body: {
        name: fixtures.networkMock.name,
        list_type: fixtures.networkMock.networkListType,
        items_values: fixtures.networkMock.networkContentList
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.networkMock)

    expect(feedbackMessage).toBe('Resource successfully created')
  })
})
