import { formatCurrencyString, formatUnitValue } from '@/helpers'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'
import { filterOutConnectorMetrics, filterOutConnectorProducts } from './filter-connector-items'
const BOT_MANAGER_SLUG = 'bot_manager'

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
  application: 'Application',
  application_accelerator: 'Application Accelerator',
  cache: 'Cache',
  connector: 'Connector',
  data_stream: 'Data Stream',
  ddos_protection_20gbps: 'DDoS Protection 20 Gbps',
  ddos_protection_50gbps: 'DDoS Protection 50 Gbps',
  ddos_protection_data_transferred: 'DDoS Protection Data Transferred',
  ddos_protection_unlimited: 'DDoS Protection Unlimited',
  edge_dns: 'Edge DNS',
  firewall: 'Firewall',
  functions: 'Functions',
  image_processor: 'Image Processor',
  live_ingest: 'Live Ingest',
  load_balancer: 'Load Balancer',
  network_layer_protection: 'Network Shield',
  object_storage: 'Object Storage',
  realtime_events: 'Real-Time Events',
  support_enterprise: 'Support Enterprise',
  tiered_cache: 'L2 Caching',
  waf: 'Web Application Firewall',
  web_application_firewall: 'Web Application Firewall',
  workload: 'Workloads'
}

const METRIC_SLUGS = {
  application_accelerator_data_transfer: {
    title: 'Application Accelerator Data Transfer',
    unit: 'GB'
  },
  application_requests: { title: 'Applications Requests' },
  bot_manager_invocations: { title: 'Bot Manager Requests' },
  cache_purges: { title: 'Cache Purges' },
  compute_time: { title: 'Edge Functions Compute Time', unit: 'ms' },
  connector_load_balancer_data_transfer: {
    title: 'Connector Load Balancer Data Transfer',
    unit: 'GB'
  },
  connector_shielded_connectors: {
    title: 'Connector Origin Shield Shielded Connectors',
    unit: 'Unit'
  },
  data_ingested: { title: 'Data Ingested', unit: 'GB' },
  data_scan: { title: 'Data Scan', unit: 'GB' },
  data_stream_data_streamed: { title: 'Data Streamed', unit: 'GB' },
  data_stream_data_transfer: { title: 'Data Stream Data Transfer' },
  data_stream_requests: { title: 'Data Stream Requests' },
  data_transferred: { title: 'Total Data Transferred', unit: 'GB' },
  ddos_protection_20gbps: { title: 'DDoS Protection 20 Gbps - FEE' },
  ddos_protection_50gbps: { title: 'DDoS Protection 50 Gbps - FEE' },
  ddos_protection_data_transferred: { title: 'Total Data Transfered', unit: 'GB' },
  ddos_protection_unlimited: { title: 'DDoS Protection Unlimited - FEE', unit: 'Days' },
  edge_dns_queries: { title: 'DNS - Queries' },
  edge_dns_zones: { title: 'DNS - Zones' },
  edge_storage_class_a_operations: { title: 'Class A Operations' },
  edge_storage_class_b_operations: { title: 'Class B Operations' },
  edge_storage_class_c_operations: { title: 'Class C Operations' },
  edge_storage_data_stored: { title: 'Data Stored', unit: 'GB' },
  firewall_requests: { title: 'Firewall Requests' },
  firewall_rules: { title: 'Firewall Rules' },
  hosted_zones: { title: 'Hosted Zones' },
  image_processor_images: { title: 'Images' },
  images_processed: { title: 'Images Processed' },
  invocations: { title: 'Edge Functions Invocations', unit: 'M' },
  live_ingest_data_ingestion: { title: 'Live Ingest Data Ingestion' },
  load_balancer_data_transferred: { title: 'Load Balancer Data Transfer', unit: 'GB' },
  network_layer_protection_requests: { title: 'Total Requests' },
  object_storage_class_a_operations: { title: 'Edge Storage Class A Operations' },
  object_storage_class_b_operations: { title: 'Edge Storage Class B Operations' },
  object_storage_class_c_operations: { title: 'Edge Storage Class C Operations' },
  realtime_events_data_scan: { title: 'Real-Time Events - Data Scan ', unit: 'GB' },
  realtime_events_storage: { title: 'Real-Time Events - Storage Data ', unit: 'GB' },
  requests: { title: 'Total Requests' },
  storage: { title: 'Storage', unit: 'GB' },
  tiered_cache_data_transferred: { title: 'L2 Caching Total Data Transfer', unit: 'GB' },
  waf_exceptions_rules: { title: 'WAF - Exceptions Rules' },
  waf_requests: { title: 'WAF - Requests' },
  waf_rule_sets: { title: 'WAF - Rule Sets' },
  workload_data_transfer: { title: 'Workload - Data Transfer', unit: 'GB' },
  workload_workloads: { title: 'Workload - Workloads ', unit: 'Unit' }
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
  return products
    .map((product) => {
      const service = PRODUCT_NAMES[product.productSlug]
      if (!service) return null
      return {
        service,
        value: formatCurrencyString(product.currency, product.value),
        slug: product.productSlug,
        currency: product.currency,
        descriptions: mapDescriptions(product, metricsGrouped, regionMetricsGrouped)
      }
    })
    .filter(Boolean)
}

const adapt = ({ body, statusCode }) => {
  const {
    products = [],
    productMetricsValue = [],
    productMetricsAccounted = [],
    productMetricsRegionValue = [],
    productMetricsRegionAccounted = []
  } = body.data

  const shouldShowConnectors = !hasFlagBlockApiV4()

  const productsFilteredByFlag = shouldShowConnectors
    ? products
    : filterOutConnectorProducts(products)

  const metricsValueFilteredByFlag = shouldShowConnectors
    ? productMetricsValue
    : filterOutConnectorMetrics(productMetricsValue)
  const metricsAccountedFilteredByFlag = shouldShowConnectors
    ? productMetricsAccounted
    : filterOutConnectorMetrics(productMetricsAccounted)
  const metricsRegionValueFilteredByFlag = shouldShowConnectors
    ? productMetricsRegionValue
    : filterOutConnectorMetrics(productMetricsRegionValue)
  const metricsRegionAccountedFilteredByFlag = shouldShowConnectors
    ? productMetricsRegionAccounted
    : filterOutConnectorMetrics(productMetricsRegionAccounted)

  const filteredProducts = productsFilteredByFlag.filter(
    (item) => ![BOT_MANAGER_SLUG].includes(item.productSlug)
  )

  if (!filteredProducts.length) {
    return { body: filteredProducts, statusCode }
  }

  const groupedMetrics = groupBy(metricsValueFilteredByFlag, metricsAccountedFilteredByFlag, [
    'productSlug',
    'metricSlug'
  ])

  const groupedRegionMetrics = groupBy(
    metricsRegionValueFilteredByFlag,
    metricsRegionAccountedFilteredByFlag,
    ['productSlug', 'metricSlug', 'regionName']
  )

  const data = mapProducts(filteredProducts, groupedMetrics, groupedRegionMetrics)

  return { body: data, statusCode }
}
