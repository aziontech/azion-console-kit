import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeServiceServices } from '@/services/edge-service-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat')
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
}

const fixtures = {
  edgeServiceMock: {
    id: 1239875,
    name: 'Edge Service A',
    active: true,
    last_editor: 'az editor',
    updated_at: new Date(2023, 10, 10)
  },
  disabledEdgeServiceMock: {
    id: 927376237,
    name: 'Edge Service B',
    active: false,
    last_editor: 'az editor 2',
    updated_at: new Date(2023, 10, 11)
  }
}

const makeSut = () => {
  const sut = listEdgeServiceServices

  return {
    sut
  }
}

describe('EdgeServiceServices', () => {
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
      url: `v4/orchestrator/edge_services?order_by=id&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly each edge service', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { services: [fixtures.edgeServiceMock, fixtures.disabledEdgeServiceMock] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.edgeServiceMock.id,
        name: fixtures.edgeServiceMock.name,
        active: true,
        labelActive: {
          content: 'Active',
          severity: 'success'
        },
        lastEditor: fixtures.edgeServiceMock.last_editor,
        lastModified: 'Friday, November 10, 2023',
        lastModifiedDate: new Date('2023-11-10T00:00:00.000Z')
      },
      {
        id: fixtures.disabledEdgeServiceMock.id,
        name: fixtures.disabledEdgeServiceMock.name,
        active: false,
        labelActive: {
          content: 'Inactive',
          severity: 'danger'
        },
        lastEditor: fixtures.disabledEdgeServiceMock.last_editor,
        lastModified: 'Saturday, November 11, 2023',
        lastModifiedDate: new Date('2023-11-11T00:00:00.000Z')
      }
    ])
  })
})
