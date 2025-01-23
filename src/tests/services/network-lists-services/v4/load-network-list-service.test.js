import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadNetworkListService } from '@/services/network-lists-services/v4'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  networkMock: {
    id: 123123123,
    name: 'Network AZ',
    last_editor: 'John A',
    type: 'ip_cidr',
    last_modified: new Date(2023, 10, 10)
  }
}

const makeSut = () => {
  const sut = loadNetworkListService

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
        data: fixtures.networkMock
      }
    })

    const { sut } = makeSut()
    await sut({ id: fixtures.networkMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/workspace/network_lists/${fixtures.networkMock.id}`,
      method: 'GET'
    })
  })

  it('should parse correctly the network record', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: fixtures.networkMock
      }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.networkMock.id })

    expect(result).toEqual({
      id: fixtures.networkMock.id,
      stringId: fixtures.networkMock.id.toString(),
      name: fixtures.networkMock.name,
      lastEditor: fixtures.networkMock.last_editor,
      listType: 'IP/CIDR',
      lastModified: 'Friday, November 10, 2023 at 12:00 AM',
      lastModifiedDate: new Date('2023-11-10T00:00:00.000Z')
    })
  })
})
