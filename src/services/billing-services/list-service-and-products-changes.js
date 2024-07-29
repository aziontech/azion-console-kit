import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'

export const listServiceAndProductsChangesService = async (billID) => {
  const BILL_DETAIL_QUERY = `
    query getBillDetail($billID: ID!) {
  		products: billDetail(
        aggregate: { sum: value }
        groupBy: [productSlug]
        orderBy: [productSlug_ASC],
        limit: 10000,
        filter: { billIdEq: $billID }
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
        filter: { billIdEq: $billID }
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
        filter: { billIdEq: $billID }
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
        filter: { billIdEq: $billID }
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
        filter: { billIdEq: $billID }
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
      billID
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

const groupBy = (firstData, secondData, groupParams) => {
  const dataToGroup = [...firstData, ...secondData]
  const groupedMap = dataToGroup.reduce((groupedData, item) => {
    const key = groupParams.map((param) => item[param]).join('_')
    const valueGroup = groupedData[key] || {}

    groupedData[key] = { ...valueGroup, ...item }

    return groupedData
  }, {})

  return Object.values(groupedMap)
}

const PRODUCT_NAMES = {
  edge_application: 'Edge Application',
  application_accelerator: 'Application Accelerator',
  load_balancer: 'Load Balancer',
  image_processor: 'Image Processor',
  edge_functions: 'Edge Functions',
  network_layer_protection: 'Network Layer Protection',
  web_application_firewall: 'Web Application Firewall',
  live_ingest: 'Live Ingest',
  data_stream: 'Data Stream',
  real_time_events: 'Real-Time Events',
  edge_dns: 'Edge DNS',
  edge_storage: 'Edge Storage',
  ddos_protection_20gbps: 'DDoS Protection 20Gbps',
  ddos_protection_50gbps: 'DDoS Protection 50Gbps',
  ddos_protection_data_transferred: 'DDoS Protection Data Transferred',
  ddos_protection_unlimited: 'DDoS Protection Unlimited',
  plan_business: 'Plan Business',
  plan_enterprise: 'Plan Enterprise',
  plan_missioncritical: 'Plan Mission Critical',
  support_enterprise: 'Support Enterprise',
  support_mission_critical: 'Support Mission Critical',
  waf: 'WAF',
  tiered_cache: 'Tiered Cache'
}

const METRIC_SLUGS = {
  application_accelerator_data_transferred: 'Total Data Transfered (per GB)',
  requests: 'Total Requests (per 10,000)',
  data_transferred: 'Total Data Transfered (per GB)',
  data_stream_requests: 'Total Requests (per 10,000)',
  network_layer_protection_requests: 'Total Requests (per 10,000)',
  tiered_cache_data_transferred: 'Total Data Transfered (per GB)',
  load_balancer_data_transferred: 'Total Data Transfered (per GB)',
  waf_requests: 'Total Requests (per 10,000)',
  ddos_protection_20gbps: 'DDoS Protection 20Gbps',
  ddos_protection_50gbps: 'DDoS Protection 50Gbps',
  ddos_protection_data_transferred: 'Total Data Transfered (per GB)',
  ddos_protection_unlimited: 'DDoS Protection Unlimited',
  compute_time: 'Compute Time',
  invocations: 'Invocations',
  images_processed: 'Images Processed',
  hosted_zones: 'Hosted Zones',
  edge_dns_queries: 'Standard Queries',
  data_ingested: 'Data Ingested (GB)',
  plan_business: 'Plan Business',
  plan_enterprise: 'Plan Enterprise',
  plan_missioncritical: 'Plan Mission critical',
  support_enterprise: 'Total Days',
  support_mission_critical: 'Total Days',
  data_stream_data_streamed: 'Data Streamed (GB)'
}

const mapRegionMetrics = (metric, regionMetricsGrouped) => {
  return regionMetricsGrouped
    .filter(
      (regionMetric) =>
        regionMetric.productSlug === metric.productSlug &&
        regionMetric.metricSlug === metric.metricSlug
    )
    .map((regionMetric) => ({
      country: regionMetric.regionName,
      quantity: regionMetric.accounted,
      price: regionMetric.value,
      slug: regionMetric.metricSlug
    }))
}

const mapDescriptions = (product, metricsGrouped, regionMetricsGrouped) => {
  return metricsGrouped
    .filter((metric) => metric.productSlug === product.productSlug)
    .map((metric) => ({
      service: METRIC_SLUGS[metric.metricSlug],
      slug: metric.metricSlug,
      quantity: metric.accounted,
      price: metric.value,
      data: mapRegionMetrics(metric, regionMetricsGrouped)
    }))
}

const mapProducts = (products, metricsGrouped, regionMetricsGrouped) => {
  return products.map((product) => ({
    service: PRODUCT_NAMES[product.productSlug],
    value: product.value,
    slug: product.productSlug,
    currency: product.currency,
    descriptions: mapDescriptions(product, metricsGrouped, regionMetricsGrouped)
  }))
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

  const data = mapProducts(products, groupedMetrics, groupedRegionMetrics)

  return { body: data, statusCode }
}
