import { describe, expect, it, vi } from 'vitest'
import { listServiceAndProductsChangesService } from '@/services/billing-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { formatCurrencyString } from '@/helpers'

const fixtures = {
  mockResponse: {
    data: {
      products: [
        {
          productSlug: 'edge_application',
          value: 6.75,
          currency: 'BRL'
        },
        {
          productSlug: 'data_stream',
          value: 0,
          currency: 'BRL'
        }
      ],
      productMetricsValue: [
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          value: 5.23
        },
        {
          productSlug: 'edge_application',
          metricSlug: 'data_transferred',
          value: 1.52
        },
        {
          productSlug: 'data_stream',
          metricSlug: 'data_stream_data_streamed',
          value: 0
        },
        {
          productSlug: 'data_stream',
          metricSlug: 'data_stream_requests',
          value: 0
        }
      ],
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
      productMetricsRegionValue: [
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          regionName: 'Brazil',
          value: 4.97
        },
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          regionName: 'Canada',
          value: 0
        },
        {
          productSlug: 'edge_application',
          metricSlug: 'data_transferred',
          regionName: 'Brazil',
          value: 1.46
        },
        {
          productSlug: 'edge_application',
          metricSlug: 'data_transferred',
          regionName: 'Canada',
          value: 0
        },
        {
          productSlug: 'data_stream',
          metricSlug: 'data_stream_data_streamed',
          regionName: 'Brazil',
          value: 0
        },
        {
          productSlug: 'data_stream',
          metricSlug: 'data_stream_requests',
          regionName: 'Brazil',
          value: 0
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
        value: formatCurrencyString('BRL', 6.75),
        slug: 'edge_application',
        currency: 'BRL',
        descriptions: [
          {
            service: 'Total Requests (per 10,000)',
            slug: 'requests',
            quantity: '848,506',
            price: formatCurrencyString('BRL', 5.23),
            data: [
              {
                country: 'Brazil',
                quantity: '776,472',
                price: formatCurrencyString('BRL', 4.97),
                slug: 'requests'
              },
              {
                country: 'Canada',
                quantity: '0',
                price: formatCurrencyString('BRL', 0.0),
                slug: 'requests'
              }
            ]
          },
          {
            service: 'Total Data Transfered (per GB)',
            slug: 'data_transferred',
            quantity: '1.727 GB',
            price: formatCurrencyString('BRL', 1.52),
            data: [
              {
                country: 'Brazil',
                quantity: '1.539 GB',
                price: formatCurrencyString('BRL', 1.46),
                slug: 'data_transferred'
              },
              {
                country: 'Canada',
                quantity: '0 GB',
                price: formatCurrencyString('BRL', 0.0),
                slug: 'data_transferred'
              }
            ]
          }
        ]
      },
      {
        service: 'Data Stream',
        value: formatCurrencyString('BRL', 0.0),
        slug: 'data_stream',
        currency: 'BRL',
        descriptions: [
          {
            service: 'Data Streamed (GB)',
            slug: 'data_stream_data_streamed',
            quantity: '0 GB',
            price: formatCurrencyString('BRL', 0.0),
            data: [
              {
                country: 'Brazil',
                quantity: '0 GB',
                price: formatCurrencyString('BRL', 0.0),
                slug: 'data_stream_data_streamed'
              }
            ]
          },
          {
            service: 'Total Requests (per 10,000)',
            slug: 'data_stream_requests',
            quantity: '0',
            price: formatCurrencyString('BRL', 0.0),
            data: [
              {
                country: 'Brazil',
                quantity: '0',
                price: formatCurrencyString('BRL', 0.0),
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
  const sut = listServiceAndProductsChangesService

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
