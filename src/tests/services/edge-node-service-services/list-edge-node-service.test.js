import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listServiceEdgeNodeService } from '@/services/edge-node-service-services'
import { describe, expect, it, vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat')
    .mockImplementationOnce((_, options) => DateTimeFormat(locale, { ...options }))
    .mockImplementationOnce((_, options) => DateTimeFormat(locale, { ...options }))
}

const fixtures = {
  payload: {
    id: 123,
    bound: true,
    page: 1
  },
  mockResponse: [
    {
      bind_id: 1,
      name: 'test',
      service_id: 1,
      last_editor: 'test',
      updated_at: '2021-09-09T13:00:00.000Z',
      is_active: true
    },
    {
      bind_id: 1,
      name: 'test',
      service_id: 1,
      last_editor: 'test',
      updated_at: '2021-09-09T13:00:00.000Z',
      is_active: false
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
    await sut(fixtures.payload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_node/${fixtures.payload.id}/services?page=1&page_size=1000000&is_bound=${fixtures.payload.bound}`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned firewalls', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { services: fixtures.mockResponse }
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
