import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeAccountingBaseUrl } from './make-accounting-base-url'
import { mapProductMetrics } from '@/helpers'

export const listServiceAndProductsAccountChangesService = async (billID) => {
  const BILL_DETAIL_QUERY = `
    query getBillDetail($billID: ID!, $invoiceId: String!) {
  		productMetricsAccounted: accountingDetail(
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
      productMetricsRegionAccounted: accountingDetail(
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
      url: `${makeAccountingBaseUrl()}`,
      method: 'POST',
      body: graphQLPayload
    },
    graphQLApi
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = ({ body, statusCode }) => {
  const { productMetricsAccounted = [], productMetricsRegionAccounted = [] } = body.data

  if (!productMetricsAccounted.length) {
    return { body: productMetricsAccounted, statusCode }
  }

  const data = mapProductMetrics([], productMetricsAccounted, productMetricsRegionAccounted, false)

  return { body: data, statusCode }
}
