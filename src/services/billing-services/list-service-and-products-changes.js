import { formatCurrencyString, formatUnitValue } from '@/helpers'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeBillingBaseUrl } from './make-billing-base-url'

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

  let httpResponse = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: `${makeBillingBaseUrl()}`,
    method: 'POST',
    body: graphQLPayload
  })

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
  application_accelerator_data_transferred: { title: 'Total Data Transfered (per GB)', unit: 'GB' },
  requests: { title: 'Total Requests (per 10,000)' },
  data_transferred: { title: 'Total Data Transfered (per GB)', unit: 'GB' },
  data_stream_requests: { title: 'Total Requests (per 10,000)' },
  network_layer_protection_requests: { title: 'Total Requests (per 10,000)' },
  tiered_cache_data_transferred: { title: 'Total Data Transfered (per GB)', unit: 'GB' },
  load_balancer_data_transferred: { title: 'Total Data Transfered (per GB)', unit: 'GB' },
  waf_requests: { title: 'Total Requests (per 10,000)' },
  ddos_protection_20gbps: { title: 'DDoS Protection 20Gbps' },
  ddos_protection_50gbps: { title: 'DDoS Protection 50Gbps' },
  ddos_protection_data_transferred: { title: 'Total Data Transfered (per GB)', unit: 'GB' },
  ddos_protection_unlimited: { title: 'DDoS Protection Unlimited' },
  compute_time: { title: 'Compute Time' },
  invocations: { title: 'Invocations' },
  images_processed: { title: 'Images Processed' },
  hosted_zones: { title: 'Hosted Zones' },
  edge_dns_queries: { title: 'Standard Queries' },
  data_ingested: { title: 'Data Ingested (GB)', unit: 'GB' },
  plan_business: { title: 'Plan Business' },
  plan_enterprise: { title: 'Plan Enterprise' },
  plan_missioncritical: { title: 'Plan Mission critical' },
  support_enterprise: { title: 'Total Days', unit: 'Days' },
  support_mission_critical: { title: 'Total Days', unit: 'Days' },
  data_stream_data_streamed: { title: 'Data Streamed (GB)', unit: 'GB' }
}

const mapRegionMetrics = (metric, regionMetricsGrouped, currency, unit) => {
  return regionMetricsGrouped.reduce((list, regionMetric) => {
    if (
      regionMetric.productSlug === metric.productSlug &&
      regionMetric.metricSlug === metric.metricSlug
    ) {
      list.push({
        country: regionMetric.regionName,
        quantity: formatUnitValue(regionMetric.accounted, unit),
        price: formatCurrencyString(currency, regionMetric.value),
        slug: regionMetric.metricSlug
      })
    }
    return list
  }, [])
}

const mapDescriptions = (product, metricsGrouped, regionMetricsGrouped) => {
  return metricsGrouped.reduce((list, metric) => {
    if (metric.productSlug === product.productSlug) {
      const unit = METRIC_SLUGS[metric.metricSlug]?.unit
      list.push({
        service: METRIC_SLUGS[metric.metricSlug]?.title,
        slug: metric.metricSlug,
        quantity: formatUnitValue(metric.accounted, unit),
        price: formatCurrencyString(product.currency, metric.value),
        data: mapRegionMetrics(metric, regionMetricsGrouped, product.currency, unit)
      })
    }
    return list
  }, [])
}

const mapProducts = (products, metricsGrouped, regionMetricsGrouped) => {
  return products.map((product) => ({
    service: PRODUCT_NAMES[product.productSlug],
    value: formatCurrencyString(product.currency, product.value),
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
