import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listResourcesServices } from '@/services/edge-service-resources-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat')
    .mockImplementationOnce((_, options) => DateTimeFormat(locale, { ...options }))
    .mockImplementationOnce((_, options) => DateTimeFormat(locale, { ...options }))
}

const fixtures = {
  mock: [
    {
      id: 1239875,
      name: 'Edge Service A',
      trigger: 'some trigger',
      content_type: 'some content type',
      last_editor: 'az editor',
      updated_at: new Date(2023, 10, 10)
    },
    {
      id: 927376237,
      name: 'Edge Service B',
      trigger: 'some trigger',
      content_type: 'some content type',
      last_editor: 'az editor 2',
      updated_at: new Date(2023, 10, 11)
    }
  ]
}

const makeSut = () => {
  const sut = listResourcesServices

  return {
    sut
  }
}

describe('EdgeServiceResourcesServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })
    const edgeServiceIdMock = 1
    const { sut } = makeSut()

    await sut({
      id: edgeServiceIdMock
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_services/${edgeServiceIdMock}/resources?filter=&order_by=name&sort=asc&page=1&page_size=10`,
      method: 'GET'
    })
  })

  it('should parsed correctly each edge service', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { resources: fixtures.mock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: 1 })

    expect(result).toEqual([
      {
        id: fixtures.mock[0].id,
        name: fixtures.mock[0].name,
        trigger: fixtures.mock[0].trigger,
        contentType: fixtures.mock[0].content_type,
        lastEditor: fixtures.mock[0].last_editor,
        lastModified: 'Friday, November 10, 2023',
        lastModifiedDate: new Date('2023-11-10T00:00:00.000Z')
      },
      {
        id: fixtures.mock[1].id,
        name: fixtures.mock[1].name,
        trigger: fixtures.mock[1].trigger,
        contentType: fixtures.mock[1].content_type,
        lastEditor: fixtures.mock[1].last_editor,
        lastModified: 'Saturday, November 11, 2023',
        lastModifiedDate: new Date('2023-11-11T00:00:00.000Z')
      }
    ])
  })
})
