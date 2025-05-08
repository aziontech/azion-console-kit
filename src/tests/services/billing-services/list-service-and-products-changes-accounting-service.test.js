import { describe, expect, it, vi } from 'vitest'
import {
  listServiceAndProductsChangesAccountingService,
  joinEdgeApplicationWithTieredCache
} from '@/services/billing-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const mockDescription = [
  {
    service: 'Total Data Transfered',
    slug: 'data_transferred',
    quantity: '848,506 GB',
    price: 0,
    data: [
      {
        country: 'Brazil',
        quantity: '848,506 GB',
        price: 0,
        slug: 'data_transferred'
      }
    ]
  },
  {
    service: 'Total Data Transfered',
    slug: 'tiered_cache_data_transferred',
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

const fixtures = {
  mockResponse: {
    data: {
      accountingDetail: [
        {
          billId: '123',
          periodTo: '2024-03-20',
          accounted: 848506,
          invoiceNumber: 'INV-001',
          regionName: 'Brazil',
          productSlug: 'edge_application',
          metricSlug: 'requests'
        },
        {
          billId: '123',
          periodTo: '2024-03-20',
          accounted: 1.726767336,
          invoiceNumber: 'INV-001',
          regionName: 'Brazil',
          productSlug: 'edge_application',
          metricSlug: 'data_transferred'
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
            service: 'Total Requests',
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
            service: 'Total Data Transfered',
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
  mockError: [{ message: 'Error' }],
  mockJoinEdgeApplicationWithTieredCache: [
    {
      service: 'Application Accelerator',
      slug: 'application_accelerator',
      descriptions: mockDescription
    },
    {
      service: 'Edge Application',
      slug: 'edge_application',
      descriptions: mockDescription
    },
    {
      service: 'Data Stream',
      slug: 'data_stream',
      descriptions: mockDescription
    },
    {
      service: 'Image Processor',
      slug: 'image_processor',
      descriptions: mockDescription
    },
    {
      service: 'WAF',
      slug: 'waf',
      descriptions: mockDescription
    },
    {
      service: 'Tiered Cache',
      slug: 'tiered_cache',
      descriptions: mockDescription
    },
    {
      service: 'Edge Storage',
      slug: 'edge_storage',
      descriptions: mockDescription
    },
    {
      service: 'Bot Manager',
      slug: 'bot_manager',
      descriptions: mockDescription
    }
  ]
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

  it('should correctly remove specified services without affecting others', async () => {
    const expectedServices = [
      {
        service: 'Application Accelerator',
        slug: 'application_accelerator',
        descriptions: mockDescription
      },
      {
        service: 'Edge Application',
        slug: 'edge_application',
        descriptions: mockDescription
      },
      {
        service: 'Data Stream',
        slug: 'data_stream',
        descriptions: mockDescription
      },
      {
        service: 'Image Processor',
        slug: 'image_processor',
        descriptions: mockDescription
      },
      {
        service: 'WAF',
        slug: 'waf',
        descriptions: mockDescription
      }
    ]

    const result = joinEdgeApplicationWithTieredCache(
      fixtures.mockJoinEdgeApplicationWithTieredCache
    )

    expect(result).toEqual(expectedServices)
  })
})
