import { describe, expect, it, vi } from 'vitest'
import { listServiceAndProductsAccountChangesService } from '@/services/billing-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  mockResponse: {
    data: {
      productMetricsAccounted: [
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          accounted: 848506
        },
        {
          productSlug: 'edge_application',
          metricSlug: 'data_transferred',
          accounted: 1.726767336
        },
        {
          productSlug: 'data_stream',
          metricSlug: 'data_stream_data_streamed',
          accounted: 0
        },
        {
          productSlug: 'data_stream',
          metricSlug: 'data_stream_requests',
          accounted: 0
        }
      ],
      productMetricsRegionAccounted: [
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          regionName: 'Brazil',
          accounted: 776472
        },
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          regionName: 'Canada',
          accounted: 0
        },
        {
          productSlug: 'edge_application',
          metricSlug: 'data_transferred',
          regionName: 'Brazil',
          accounted: 1.539394378
        },
        {
          productSlug: 'edge_application',
          metricSlug: 'data_transferred',
          regionName: 'Canada',
          accounted: 0
        },
        {
          productSlug: 'data_stream',
          metricSlug: 'data_stream_data_streamed',
          regionName: 'Brazil',
          accounted: 0
        },
        {
          productSlug: 'data_stream',
          metricSlug: 'data_stream_requests',
          regionName: 'Brazil',
          accounted: 0
        }
      ]
    }
  },
  formattedResponse: {
    data: [
      {
        service: 'Edge Application',
        slug: 'edge_application',
        descriptions: [
          {
            service: 'Total Requests (per 10,000)',
            slug: 'requests',
            quantity: 848506,
            data: [
              {
                country: 'Brazil',
                quantity: 776472,
                slug: 'requests'
              },
              { country: 'Canada', quantity: 0, slug: 'requests' }
            ]
          },
          {
            service: 'Total Data Transfered (per GB)',
            slug: 'data_transferred',
            quantity: 1.726767336,
            data: [
              {
                country: 'Brazil',
                quantity: 1.539394378,
                slug: 'data_transferred'
              },
              {
                country: 'Canada',
                quantity: 0,
                slug: 'data_transferred'
              }
            ]
          }
        ]
      },
      {
        service: 'Data Stream',
        slug: 'data_stream',
        descriptions: [
          {
            service: 'Data Streamed (GB)',
            slug: 'data_stream_data_streamed',
            quantity: 0,
            data: [
              {
                country: 'Brazil',
                quantity: 0,
                slug: 'data_stream_data_streamed'
              }
            ]
          },
          {
            service: 'Total Requests (per 10,000)',
            slug: 'data_stream_requests',
            quantity: 0,
            data: [
              {
                country: 'Brazil',
                quantity: 0,
                slug: 'data_stream_requests'
              }
            ]
          }
        ]
      }
    ]
  },
  mockError: [{ message: 'Error' }]
}

const makeSut = () => {
  const sut = listServiceAndProductsAccountChangesService

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should return correct data on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mockResponse
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(fixtures.formattedResponse.data)
  })

  it('should return an error if the request fails', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(fixtures.mockError)
    const { sut } = makeSut()

    await expect(sut()).rejects.toEqual(fixtures.mockError)
  })

  it('should return empty array if no products are found', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { products: [] } }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([])
  })
})
