import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeApplicationsService } from '@/services/edge-application-services/v4'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat')
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
}

const fixtures = {
  edgeApplicationsMock: {
    id: 1239875,
    active: true,
    last_editor: 'az editor',
    last_modified: new Date(2023, 10, 10),
    name: 'edge app AZ',
    modules: {
      edge_cache_enabled: true,
      edge_functions_enabled: false,
      application_accelerator_enabled: false,
      image_processor_enabled: false,
      tiered_cache_enabled: false
    },
    debug: false
  },
  disabledEdgeApplicationsMock: {
    id: 1239875,
    active: false,
    last_editor: 'az editor 2',
    last_modified: new Date(2023, 11, 10),
    name: 'edge app AZ 2',
    modules: {
      edge_cache_enabled: true,
      edge_functions_enabled: false,
      application_accelerator_enabled: false,
      image_processor_enabled: false,
      tiered_cache_enabled: false
    },
    debug: false
  }
}

const makeSut = () => {
  const sut = listEdgeApplicationsService

  return {
    sut
  }
}

describe('EdgeApplicationServices', () => {
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
    const version = 'v4'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_application/applications?ordering=&page=1&page_size=200&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned edge applications', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.edgeApplicationsMock, fixtures.disabledEdgeApplicationsMock] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.edgeApplicationsMock.id,
        name: fixtures.edgeApplicationsMock.name,
        lastEditor: 'az editor',
        lastModified: new Date('2023-11-10T00:00:00.000Z'),
        lastModify: 'Friday, November 10, 2023'
      },
      {
        id: fixtures.disabledEdgeApplicationsMock.id,
        name: fixtures.disabledEdgeApplicationsMock.name,
        lastEditor: 'az editor 2',
        lastModify: 'Sunday, December 10, 2023',
        lastModified: new Date('2023-12-10T00:00:00.000Z')
      }
    ])
  })
})
