import { describe, it, expect } from 'vitest'
import { mapProductMetrics } from '@/helpers/billing-utils'

const fixtures = {
  products: [
    { productSlug: 'edge_application', currency: 'USD', value: 100 },
    { productSlug: 'application_accelerator', currency: 'USD', value: 200 }
  ],
  metricsGrouped: [
    { productSlug: 'edge_application', metricSlug: 'requests', accounted: 1000, value: 10 },
    {
      productSlug: 'application_accelerator',
      metricSlug: 'data_transferred',
      accounted: 500,
      value: 5
    }
  ],
  regionMetricsGrouped: [
    {
      productSlug: 'edge_application',
      metricSlug: 'requests',
      regionName: 'US',
      accounted: 600,
      value: 6
    },
    {
      productSlug: 'edge_application',
      metricSlug: 'requests',
      regionName: 'EU',
      accounted: 400,
      value: 4
    },
    {
      productSlug: 'application_accelerator',
      metricSlug: 'data_transferred',
      regionName: 'US',
      accounted: 300,
      value: 3
    },
    {
      productSlug: 'application_accelerator',
      metricSlug: 'data_transferred',
      regionName: 'EU',
      accounted: 200,
      value: 2
    }
  ]
}

describe('mapProductMetrics', () => {
  it('should return an empty array when input arrays are empty', () => {
    const result = mapProductMetrics([], [], [])
    expect(result).toEqual([])
  })

  it('should map products with their respective metrics and grouped regions', () => {
    const result = mapProductMetrics(
      fixtures.products,
      fixtures.metricsGrouped,
      fixtures.regionMetricsGrouped,
      false
    )
    expect(result).toEqual([
      {
        service: 'Edge Application',
        slug: 'edge_application',
        currency: 'USD',
        price: 100,
        descriptions: [
          {
            service: 'Total Requests (per 10,000)',
            slug: 'requests',
            quantity: 1000,
            data: [
              { country: 'US', quantity: 600, slug: 'requests' },
              { country: 'EU', quantity: 400, slug: 'requests' }
            ]
          }
        ]
      },
      {
        service: 'Application Accelerator',
        slug: 'application_accelerator',
        currency: 'USD',
        price: 200,
        descriptions: [
          {
            service: 'Total Data Transfered (per GB)',
            slug: 'data_transferred',
            quantity: 500,
            data: [
              { country: 'US', quantity: 300, slug: 'data_transferred' },
              { country: 'EU', quantity: 200, slug: 'data_transferred' }
            ]
          }
        ]
      }
    ])
  })

  it('should include price in the response when withValue is true', () => {
    const result = mapProductMetrics(
      fixtures.products,
      fixtures.metricsGrouped,
      fixtures.regionMetricsGrouped,
      true
    )
    expect(result).toEqual([
      {
        service: 'Edge Application',
        slug: 'edge_application',
        currency: 'USD',
        price: 100,
        descriptions: [
          {
            service: 'Total Requests (per 10,000)',
            slug: 'requests',
            quantity: 1000,
            price: 10,
            data: [
              { country: 'US', quantity: 600, slug: 'requests', price: 6 },
              { country: 'EU', quantity: 400, slug: 'requests', price: 4 }
            ]
          }
        ]
      },
      {
        service: 'Application Accelerator',
        slug: 'application_accelerator',
        currency: 'USD',
        price: 200,
        descriptions: [
          {
            service: 'Total Data Transfered (per GB)',
            slug: 'data_transferred',
            quantity: 500,
            price: 5,
            data: [
              { country: 'US', quantity: 300, slug: 'data_transferred', price: 3 },
              { country: 'EU', quantity: 200, slug: 'data_transferred', price: 2 }
            ]
          }
        ]
      }
    ])
  })
})
