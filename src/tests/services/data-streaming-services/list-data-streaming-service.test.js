import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDataStreamingService } from '@/services/data-streaming-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  templateMock: {
    name: 'template name'
  },
  dataStreamingMock: {
    template_id: 123,
    id: 789,
    name: 'data streaming name',
    data_source: 'http',
    active: true
  },
  dataStreamingDisabledMock: {
    template_id: 123,
    id: 444,
    name: 'data streaming name',
    data_source: 'http',
    active: false
  }
}

const makeSut = () => {
  const sut = listDataStreamingService
  return {
    sut
  }
}

describe('DataStreamingServices', () => {
  it('should call api with correct params', async () => {
    const httpClientSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: []
      }
    })
    const { sut } = makeSut()
    await sut()

    expect(httpClientSpy).toHaveBeenCalledOnce()
    expect(httpClientSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: 'data_streaming/streamings'
    })
  })

  it('should call template API when records are found', async () => {
    const httpClientSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: {
          results: [fixtures.dataStreamingMock]
        }
      })
      .mockResolvedValueOnce({
        statusCode: 200,
        body: {
          results: fixtures.templateMock
        }
      })

    const { sut } = makeSut()

    const result = await sut()

    expect(httpClientSpy).toHaveBeenCalledTimes(2)
    expect(result).toEqual([
      {
        active: 'Yes',
        dataSource: 'Edge Applications',
        id: 789,
        name: 'data streaming name',
        templateName: 'template name'
      }
    ])
  })

  it('should parse all records', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: {
          results: [fixtures.dataStreamingMock, fixtures.dataStreamingDisabledMock]
        }
      })
      .mockResolvedValue({
        statusCode: 200,
        body: {
          results: fixtures.templateMock
        }
      })

    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        active: 'Yes',
        dataSource: 'Edge Applications',
        id: 789,
        name: 'data streaming name',
        templateName: 'template name'
      },
      {
        active: 'No',
        dataSource: 'Edge Applications',
        id: 444,
        name: 'data streaming name',
        templateName: 'template name'
      }
    ])
  })
})
