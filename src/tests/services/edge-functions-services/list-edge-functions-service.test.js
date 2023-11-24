import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFunctionsService } from '@/services/edge-functions-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat')
    .mockImplementationOnce((_, options) => DateTimeFormat(locale, { ...options }))
    .mockImplementationOnce((_, options) => DateTimeFormat(locale, { ...options }))
}

const fixtures = {
  edgeFunctionMock: {
    active: true,
    version: '1.0.0',
    language: 'js',
    initiator_type: 'Initiator',
    id: 1239875,
    last_editor: 'az editor',
    modified: new Date(2023, 10, 10),
    name: 'AZ firewall',
    reference_count: '2'
  },
  disabledEdgeFunctionMock: {
    active: false,
    version: null,
    language: 'Go',
    initiator_type: 'Initiator 2',
    id: 852030,
    last_editor: 'az editor 2',
    modified: new Date(2023, 11, 10),
    name: 'AZ firewall 2',
    reference_count: '3'
  }
}

const makeSut = () => {
  const sut = listEdgeFunctionsService

  return {
    sut
  }
}

describe('EdgeFunctionsServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_functions?order_by=id&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned firewalls', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.edgeFunctionMock, fixtures.disabledEdgeFunctionMock] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        active: 'Yes',
        version: fixtures.edgeFunctionMock.version,
        language: fixtures.edgeFunctionMock.language,
        initiatorType: fixtures.edgeFunctionMock.initiator_type,
        referenceCount: fixtures.edgeFunctionMock.reference_count,
        id: fixtures.edgeFunctionMock.id,
        name: fixtures.edgeFunctionMock.name,
        lastEditor: fixtures.edgeFunctionMock.last_editor,
        lastModified: 'Friday, November 10, 2023',
        lastModifiedDate: new Date('2023-11-10T00:00:00.000Z')
      },
      {
        active: 'No',
        version: '-',
        language: fixtures.disabledEdgeFunctionMock.language,
        initiatorType: fixtures.disabledEdgeFunctionMock.initiator_type,
        referenceCount: fixtures.disabledEdgeFunctionMock.reference_count,
        id: fixtures.disabledEdgeFunctionMock.id,
        name: fixtures.disabledEdgeFunctionMock.name,
        lastEditor: fixtures.disabledEdgeFunctionMock.last_editor,
        lastModified: 'Sunday, December 10, 2023',
        lastModifiedDate: new Date('2023-12-10T00:00:00.000Z')
      }
    ])
  })
})
