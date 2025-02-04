import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiRequestError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { listDataStreamService } from '@/services/data-stream-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  templateMock: {
    id: 123,
    name: 'template name'
  },
  dataStreamMock: {
    template_id: 123,
    id: 789,
    name: 'data stream name',
    data_source: 'http',
    endpoint: {
      endpoint_type: 'standard'
    },
    active: true
  },
  dataStreamDisabledMock: {
    template_id: 123,
    id: 444,
    name: 'data stream name',
    data_source: 'http',
    endpoint: {
      endpoint_type: 'kafka'
    },
    active: false
  }
}

const makeSut = () => {
  const sut = listDataStreamService
  return {
    sut
  }
}

describe('DataStreamServices', () => {
  it('should call api with correct params', async () => {
    const httpClientSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: []
      }
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut()

    expect(httpClientSpy).toHaveBeenCalledOnce()
    expect(httpClientSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `${version}/data_streaming/streamings`
    })
  })

  it('should call template API when records are found', async () => {
    const httpClientSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: {
          results: [fixtures.dataStreamMock]
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
        dataSource: 'Edge Applications',
        id: 789,
        name: 'data stream name',
        templateName: 'template name',
        endpointType: 'standard',
        active: {
          content: 'Active',
          severity: 'success'
        }
      }
    ])
  })

  it('should parse all records', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: {
          results: [fixtures.dataStreamMock, fixtures.dataStreamDisabledMock]
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
        dataSource: 'Edge Applications',
        id: 789,
        name: 'data stream name',
        templateName: 'template name',
        endpointType: 'standard',
        active: {
          content: 'Active',
          severity: 'success'
        }
      },
      {
        dataSource: 'Edge Applications',
        id: 444,
        name: 'data stream name',
        templateName: 'template name',
        endpointType: 'kafka',
        active: {
          content: 'Inactive',
          severity: 'danger'
        }
      }
    ])
  })
  it('should return no registers on invalid dataStream schema', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: null
      })
      .mockResolvedValue({
        statusCode: 200,
        body: {
          results: [fixtures.templateMock]
        }
      })

    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([])
  })

  it('should call api with 403 not permission', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 403,
      body: {
        details: 'You do not have permission to do this action.'
      }
    })

    const { sut } = makeSut()

    try {
      await sut()
    } catch (error) {
      expect(error).toBe('You do not have permission to do this action.')
    }
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new InvalidApiRequestError().message
    },
    {
      statusCode: 401,
      expectedError: new InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: {
          results: []
        }
      })
      const { sut } = makeSut()

      const response = sut()

      expect(response).rejects.toBe(expectedError)
    }
  )
})
