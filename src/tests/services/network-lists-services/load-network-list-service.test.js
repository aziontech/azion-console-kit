import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadNetworkListService } from '@/services/network-lists-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

    await sut({ id: fixtures.networkMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `network_lists/${fixtures.networkMock.id}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the loaded network list record', async () => {
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
      listType: 'IP/CIDR',
      itemsValues: `123.123.123.123\n192.168.0.0`,
      lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full', timeStyle: 'short' }).format(
        fixtures.networkMock.last_modified
      )
    })
  })
  it('should parsed correctly the loaded network list record with countries', async () => {
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
      listType: 'countries',
      itemsValues: fixtures.networkMockWithCountries.items_values,
      lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full', timeStyle: 'short' }).format(
        fixtures.networkMockWithCountries.last_modified
      )
    })
  })
})
