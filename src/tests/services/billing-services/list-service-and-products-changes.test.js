import { describe, expect, it, vi } from 'vitest'
import { listServiceAndProductsChangesService } from '@/services/billing-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  mockResponse: {
    data: {
      products: [
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          accounted: 0,
          value: 5.23,
          currency: 'BRL'
        }
      ],
      product_detail: [
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          regionName: 'Brazil',
          accounted: 776472,
          value: 4.97,
          currency: 'BRL'
        }
      ],
      products_accounted: [
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          accounted: 848506
        }
      ],
      product_detail_accounted: [
        {
          productSlug: 'edge_application',
          metricSlug: 'requests',
          regionName: 'Brazil',
          accounted: 776472
        }
      ]
    }
  },
  formattedResponse: {
    data: [
      {
        service: 'Edge Application',
        value: 5.23,
        slug: 'edge_application',
        descriptions: [
          {
            service: 'Total Requests (per 10,000)',
            slug: 'requests',
            quantity: 848506,
            price: 5.23,
            data: [
              {
                country: 'Brazil',
                quantity: 776472,
                price: 4.97,
                slug: 'requests'
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
})
