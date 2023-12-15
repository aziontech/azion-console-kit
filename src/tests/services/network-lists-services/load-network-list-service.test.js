import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadNetworkListService } from '@/services/network-lists-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  networkMock: {
    id: 123123123,
    name: 'Network AZ',
    last_editor: 'John A',
    list_type: 'IP/CIDR',
    items_values: '123.123.123.123,192.168.0.0',
    last_modified: new Date(2023, 10, 10)
  },
  networkMockWithCountries: {
    id: 9862153798,
    name: 'Network AZ with Countries',
    last_editor: 'Marie B',
    list_type: 'countries',
    items_values: ['Brazil', 'EUA'],
    last_modified: new Date(2023, 5, 11)
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
        results: fixtures.networkMock
      }
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: fixtures.networkMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/network_lists/${fixtures.networkMock.id}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the loaded network list record', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: fixtures.networkMock
      }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.networkMock.id })

    expect(result).toEqual({
      name: fixtures.networkMock.name,
      id: fixtures.networkMock.id,
      lastEditor: fixtures.networkMock.last_editor,
      networkListType: 'IP/CIDR',
      itemsValuesCountry: [],
      itemsValues: `123.123.123.123\n192.168.0.0`,
      lastModified: 'Friday, November 10, 2023 at 12:00 AM'
    })
  })
  it('should parsed correctly the loaded network list record with countries', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: fixtures.networkMockWithCountries
      }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.networkMockWithCountries.id })

    expect(result).toEqual({
      name: fixtures.networkMockWithCountries.name,
      id: fixtures.networkMockWithCountries.id,
      lastEditor: fixtures.networkMockWithCountries.last_editor,
      networkListType: 'countries',
      itemsValues: '',
      itemsValuesCountry: fixtures.networkMockWithCountries.items_values,
      lastModified: 'Sunday, June 11, 2023 at 12:00 AM'
    })
  })
})
