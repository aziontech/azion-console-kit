import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editNetworkListService } from '@/services/network-lists-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsMock: {
    id: 56782,
    name: 'Az network',
    networkListType: 'ip_cidr',
    itemsValues: '123.123.123.123'
  }
}

const makeSut = () => {
  const sut = editNetworkListService

  return {
    sut
  }
}

describe('NetworkListsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    await sut(fixtures.dnsMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `network_lists/${fixtures.dnsMock.id}`,
      method: 'PUT',
      body: {
        name: fixtures.dnsMock.name,
        list_type: fixtures.dnsMock.networkListType,
        items_values: [fixtures.dnsMock.itemsValues]
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.dnsMock)

    expect(feedbackMessage).toBe('Resource successfully updated')
  })
})
