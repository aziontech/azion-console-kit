import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listNetworkListService } from '@/services/network-lists-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  networkMock: {
    id: 123123123,
    name: 'Network AZ',
    last_editor: 'John A',
    list_type: 'ip_cidr',
    last_modified: new Date(2023, 10, 10)
  }
}

const makeSut = () => {
  const sut = listNetworkListService

  return {
    sut
  }
}

describe('NetworkListsServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: null
      }
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `network_lists`,
      method: 'GET'
    })
  })

  it('should parsed correctly each network record', async () => {
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.networkMock]
      }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        id: fixtures.networkMock.id,
        name: fixtures.networkMock.name,
        lastEditor: fixtures.networkMock.last_editor,
        listType: 'IP/CIDR',
        lastModified: new Intl.DateTimeFormat('us', {
          dateStyle: 'full',
          timeStyle: 'short'
        }).format(fixtures.networkMock.last_modified)
      }
    ])
  })
})
