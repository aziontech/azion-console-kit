import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeApplicationsService } from '@/services/edge-application-services'
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
    debug_rules: true,
    last_editor: 'az editor',
    last_modified: new Date(2023, 10, 10),
    name: 'edge app AZ',
    origins: [{ name: 'origin 1' }, { name: 'origin 2' }]
  },
  disabledEdgeApplicationsMock: {
    id: 1239875,
    active: false,
    debug_rules: false,
    last_editor: 'az editor 2',
    last_modified: new Date(2023, 11, 10),
    name: 'edge app AZ 2',
    origins: []
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
    const version = 'v3'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications?order_by=name&sort=asc&page=1&page_size=200`,
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
        origins: [
          fixtures.edgeApplicationsMock.origins.at(0).name,
          fixtures.edgeApplicationsMock.origins.at(1).name
        ],
        lastEditor: 'az editor',
        lastModify: 'Friday, November 10, 2023',
        lastModifyDate: new Date('2023-11-10T00:00:00.000Z')
      },
      {
        id: fixtures.disabledEdgeApplicationsMock.id,
        name: fixtures.disabledEdgeApplicationsMock.name,
        origins: [],
        lastEditor: 'az editor 2',
        lastModify: 'Sunday, December 10, 2023',
        lastModifyDate: new Date('2023-12-10T00:00:00.000Z')
      }
    ])
  })
})
