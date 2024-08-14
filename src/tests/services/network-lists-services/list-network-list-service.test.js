import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listNetworkListService } from '@/services/network-lists-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  networkMock: {
    id: 123123123,
    name: 'Network AZ',
    last_editor: 'John A',
    list_type: 'ip_cidr',
    last_modified: new Date(2023, 10, 10)
  },
  page: 2,
  pageSize: 10
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
    const version = 'v3'
    await sut({ page: 2, pageSize: 10 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/network_lists?page=${fixtures.page}&page_size=${fixtures.pageSize}`,
      method: 'GET'
    })
  })

  it('should parsed correctly each network record', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.networkMock]
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.networkMock.id,
        stringId: fixtures.networkMock.id.toString(),
        name: fixtures.networkMock.name,
        lastEditor: fixtures.networkMock.last_editor,
        listType: 'IP/CIDR',
        lastModified: 'Friday, November 10, 2023 at 12:00 AM',
        lastModifiedDate: new Date('2023-11-10T00:00:00.000Z')
      }
    ])
  })
})
