import { describe, expect, it, vi } from 'vitest'
import { listServiceAndProductsChangesAccountingService } from '@/services/billing-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  mockResponse: {
    data: {
      accountingDetail: [
        {
          billId: "123",
          periodTo: "2024-03-20",
          accounted: 848506,
          invoiceNumber: "INV-001",
          regionName: "Brazil",
          productSlug: "edge_application",
          metricSlug: "requests"
        },
        {
          billId: "123",
          periodTo: "2024-03-20",
          accounted: 1.726767336,
          invoiceNumber: "INV-001",
          regionName: "Brazil",
          productSlug: "edge_application",
          metricSlug: "data_transferred"
        }
      ]
    }
  },
  formattedResponse: {
    data: [
      {
        service: 'Edge Application',
        value: 0,
        slug: 'edge_application',
        currency: 0,
        descriptions: [
          {
            service: 'Total Requests (per 10,000)',
            slug: 'requests',
            quantity: '848,506',
            price: 0,
            data: [
              {
                country: 'Brazil',
                quantity: '848,506',
                price: 0,
                slug: 'requests'
              }
            ]
          },
          {
            service: 'Total Data Transfered (per GB)',
            slug: 'data_transferred',
            quantity: '1.727 GB',
            price: 0,
            data: [
              {
                country: 'Brazil',
                quantity: '1.727 GB',
                price: 0,
                slug: 'data_transferred'
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
  const sut = listServiceAndProductsChangesAccountingService
  return { sut }
}

describe('BillingServices', () => {
  it('should return correct data on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mockResponse
    })
    const { sut } = makeSut()

    const result = await sut('123')

    expect(result).toEqual(fixtures.formattedResponse.data)
  })

  it('should return an error if the request fails', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(fixtures.mockError)
    const { sut } = makeSut()

    await expect(sut('123')).rejects.toEqual(fixtures.mockError)
  })

  it('should return empty array if no accounting details are found', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { accountingDetail: [] } }
    })
    const { sut } = makeSut()

    const result = await sut('123')

    expect(result).toEqual([])
  })
})