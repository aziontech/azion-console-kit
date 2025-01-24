import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadNetworkListService } from '@/services/network-lists-services/v4/load-network-list-service'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  networkMock: {
    id: 123123123,
    name: 'Network AZ',
    last_editor: 'John A',
    type: 'IP/CIDR',
    items: '123.123.123.123,192.168.0.0',
    last_modified: new Date(2023, 10, 10)
  },
  networkMockWithCountries: {
    id: 9862153798,
    name: 'Network AZ with Countries',
    last_editor: 'Marie B',
    type: 'countries',
    items: ['Brazil', 'EUA'],
    last_modified: new Date(2023, 5, 11)
  }
}

const makeSut = () => {
  const sut = loadNetworkListService
  return { sut }
}

describe('NetworkListsServices V4', () => {
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

  it('should parse correctly the loaded network list record', async () => {
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
      name: fixtures.networkMock.name,
      id: fixtures.networkMock.id,
      lastEditor: fixtures.networkMock.last_editor,
      networkListType: fixtures.networkMock.type,
      itemsValuesCountry: [],
      itemsValues: '123.123.123.123\n192.168.0.0',
      lastModified: 'Friday, November 10, 2023 at 12:00 AM',
      stringId: fixtures.networkMock.id.toString()
    })
  })

  it('should parse correctly the loaded network list record with countries', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: fixtures.networkMockWithCountries
      }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.networkMockWithCountries.id })

    expect(result).toEqual({
      name: fixtures.networkMockWithCountries.name,
      id: fixtures.networkMockWithCountries.id,
      lastEditor: fixtures.networkMockWithCountries.last_editor,
      networkListType: fixtures.networkMockWithCountries.type,
      itemsValues: '',
      itemsValuesCountry: fixtures.networkMockWithCountries.items,
      lastModified: 'Sunday, June 11, 2023 at 12:00 AM',
      stringId: fixtures.networkMockWithCountries.id.toString()
    })
  })
})
