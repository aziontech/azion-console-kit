import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { groupBy, mapProductMetrics } from '@/helpers'

export const listServiceAndProductsChangesService = async (billID) => {
  const BILL_DETAIL_QUERY = `
    query getBillDetail($billID: ID!, $invoiceId: String!) {
  	  products: billDetail(
        aggregate: { sum: value }
        groupBy: [productSlug]
        orderBy: [productSlug_ASC],
        limit: 10000,
        filter: { 
          or: [ 
            { billIdEq: $billID },
            { invoiceNumberEq: $invoiceId }
          ]
        }
      ) {
        productSlug
        value: sum
        currency
      }
      productMetricsValue: billDetail(
        aggregate: { sum: value }
        groupBy: [productSlug, metricSlug]
        orderBy: [productSlug_ASC],
        limit: 10000,
        filter: { 
          or: [ 
            { billIdEq: $billID },
            { invoiceNumberEq: $invoiceId }
          ]
        }
      ) {
        productSlug
        metricSlug
        value: sum
      }
  		productMetricsAccounted: billDetail(
        aggregate: { sum: accounted }
        groupBy: [productSlug, metricSlug]
        orderBy: [productSlug_ASC],
        limit: 10000,
        filter: { 
          or: [ 
            { billIdEq: $billID },
            { invoiceNumberEq: $invoiceId }
          ]
        }
      ) {
        productSlug
        metricSlug
        accounted: sum
      }
      productMetricsRegionValue: billDetail(
        aggregate: { sum: value }
        groupBy: [productSlug, metricSlug, regionName]
        orderBy: [productSlug_ASC, metricSlug_ASC],
        limit: 10000,
        filter: { 
          or: [ 
            { billIdEq: $billID },
            { invoiceNumberEq: $invoiceId }
          ]
        }
      ) {
        productSlug
        metricSlug
        regionName
        value: sum
      }
      productMetricsRegionAccounted: billDetail(
        aggregate: { sum: accounted }
        groupBy: [productSlug, metricSlug, regionName]
        orderBy: [productSlug_ASC, metricSlug_ASC],
        limit: 10000,
        filter: { 
          or: [ 
            { billIdEq: $billID },
            { invoiceNumberEq: $invoiceId }
          ]
        }
      ) {
        productSlug
        metricSlug
        regionName
        accounted: sum
      }
  }`

  const graphQLPayload = {
    query: BILL_DETAIL_QUERY,
    variables: {
      billID,
      invoiceId: billID
    }
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeBillingBaseUrl()}`,
      method: 'POST',
      body: graphQLPayload
    },
    graphQLApi
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = ({ body, statusCode }) => {
  const {
    products = [],
    productMetricsValue = [],
    productMetricsAccounted = [],
    productMetricsRegionValue = [],
    productMetricsRegionAccounted = []
  } = body.data

  if (!products.length) {
    return { body: products, statusCode }
  }

  const groupedMetrics = groupBy(productMetricsValue, productMetricsAccounted, [
    'productSlug',
    'metricSlug'
  ])

  const groupedRegionMetrics = groupBy(productMetricsRegionValue, productMetricsRegionAccounted, [
    'productSlug',
    'metricSlug',
    'regionName'
  ])

  const data = mapProductMetrics(products, groupedMetrics, groupedRegionMetrics, true)

  return { body: data, statusCode }
}
