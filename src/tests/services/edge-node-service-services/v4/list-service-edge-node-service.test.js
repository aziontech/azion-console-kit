import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listServiceEdgeNodeService } from '@/services/edge-node-service-services/v4'
import { describe, expect, it, vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat')
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
}

const fixtures = {
  payload: {
    edgeNodeId: 123
  },
  mockResponse: [
    {
      id: 1,
      service_name: 'test',
      service_id: 1,
      last_editor: 'test',
      last_modified: '2021-09-09T13:00:00.000Z',
      active: true
    },
    {
      id: 1,
      service_name: 'test',
      service_id: 1,
      last_editor: 'test',
      last_modified: '2021-09-09T13:00:00.000Z',
      active: false
    }
  ]
}

const makeSut = () => {
  const sut = listServiceEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { services: [] }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.payload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_orchestrator/edge_nodes/${fixtures.payload.edgeNodeId}/services?ordering=name&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parsed correctly all binded firewalls', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.mockResponse }
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.payload)

    expect(result).toEqual([
      {
        id: 1,
        lastEditor: 'test',
        lastModified: 'Thursday, September 9, 2021',
        name: 'test',
        serviceId: 1,
        status: {
          content: 'Active',
          severity: 'success'
        }
      },
      {
        id: 1,
        lastEditor: 'test',
        lastModified: 'Thursday, September 9, 2021',
        name: 'test',
        serviceId: 1,
        status: {
          content: 'Inactive',
          severity: 'danger'
        }
      }
    ])
  })
})
