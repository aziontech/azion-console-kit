import { formatUnitValue } from '@/helpers'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountingBaseUrl } from './make-accounting-base-url'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'
import { filterOutConnectorMetrics } from './filter-connector-items'

const BOT_MANAGER_SLUG = 'bot_manager'

export const listServiceAndProductsChangesAccountingService = async (billID) => {
  const BILL_DETAIL_QUERY = `
    query details {
      accountingDetail (
        limit: 10000,
        filter: {
          billId: ${billID}
        },
        orderBy: [productSlug_ASC, metricSlug_ASC]
      ) {
        billId,
        periodTo,
        accounted,
        invoiceNumber,
        regionName,
        productSlug,
        metricSlug,
      }
    }`

  const graphQLPayload = {
    query: BILL_DETAIL_QUERY
  }

  let httpResponse = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: `${makeAccountingBaseUrl()}`,
    method: 'POST',
    body: graphQLPayload
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const groupBy = (data, groupParams) => {
  const groupedMap = data.reduce((groupedData, item) => {
    const key = groupParams.map((param) => item[param]).join('_')
    const valueGroup = groupedData[key] || {}

    const accounted = (valueGroup.accounted || 0) + (item.accounted || 0)
    groupedData[key] = { ...valueGroup, ...item, accounted }

    return groupedData
  }, {})

  return Object.values(groupedMap)
}

const adapt = ({ body, statusCode }) => {
  const { accountingDetail } = body.data

  const shouldShowConnectors = !hasFlagBlockApiV4()

  const filteredAccountingDetail = shouldShowConnectors
    ? accountingDetail
    : filterOutConnectorMetrics(accountingDetail)

  const productsGrouped = groupBy(filteredAccountingDetail, ['productSlug', 'metricSlug'])

  const filteredProducts = productsGrouped.filter((item) => {
    return ![BOT_MANAGER_SLUG].includes(item.productSlug)
  })

  const productsGroupedByRegion = groupBy(filteredAccountingDetail, [
    'productSlug',
    'metricSlug',
    'regionName'
  ])

  const adaptedBody = mapProducts(filteredProducts, productsGroupedByRegion)
  const data = joinEdgeApplicationWithTieredCache(adaptedBody)

  return { body: data, statusCode }
}

const PRODUCT_NAMES = {
  application: 'Application',
  application_accelerator: 'Application Accelerator',
  bot_manager: 'Bot Manager',
  cache: 'Cache',
  connector: 'Connector',
  data_stream: 'Data Stream',
  ddos_protection_20gbps: 'DDoS Protection 20 Gbps',
  ddos_protection_50gbps: 'DDoS Protection 50 Gbps',
  ddos_protection_data_transferred: 'DDoS Protection Data Transferred',
  ddos_protection_unlimited: 'DDoS Protection Unlimited',
  edge_application: 'Application',
  edge_dns: 'Edge DNS',
  edge_storage: 'Object Storage',
  firewall: 'Firewall',
  functions: 'Functions',
  image_processor: 'Image Processor',
  live_ingest: 'Live Ingest',
  load_balancer: 'Load Balancer',
  network_layer_protection: 'Network Shield',
  object_storage: 'Object Storage',
  plan_business: 'Plan Business',
  plan_enterprise: 'Plan Enterprise',
  plan_missioncritical: 'Plan Mission Critical',
  realtime_events: 'Real-Time Events',
  support_enterprise: 'Support Enterprise',
  support_mission_critical: 'Support Mission Critical',
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
    title: 'Connector Origin Shield Shielded Connectors ',
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
  realtime_events_data_scan: { title: 'Real-Time Events - Data Scan', unit: 'GB' },
  realtime_events_storage: { title: 'Real-Time Events - Storage Data', unit: 'GB' },
  requests: { title: 'Total Requests' },
  storage: { title: 'Storage', unit: 'GB' },
  tiered_cache_data_transferred: { title: 'L2 Caching Total Data Transfer', unit: 'GB' },
  waf_exceptions_rules: { title: 'WAF - Exceptions Rules' },
  waf_requests: { title: 'WAF - Requests' },
  waf_rule_sets: { title: 'WAF - Rule Sets' },
  workload_data_transfer: { title: 'Workload - Data Transfer', unit: 'GB' },
  workload_workloads: { title: 'Workload - Workloads', unit: 'Unit' }
}

const mapProducts = (productsGrouped, productsGroupedByRegion) => {
  const uniqueProducts = []

  productsGrouped.forEach((product) => {
    const existingProduct = uniqueProducts.find((uProduct) => uProduct.slug === product.productSlug)

    if (existingProduct) {
      existingProduct.descriptions = mapDescriptions(
        product,
        productsGrouped,
        productsGroupedByRegion
      )
    } else {
      const service = PRODUCT_NAMES[product.productSlug]
      if (!service) return
      uniqueProducts.push({
        service,
        value: 0,
        slug: product.productSlug,
        currency: 0,
        descriptions: mapDescriptions(product, productsGrouped, productsGroupedByRegion)
      })
    }
  })

  return uniqueProducts
}

const mapDescriptions = (product, productsGrouped, productsGroupedByRegion) => {
  productsGroupedByRegion.sort((regionA, regionB) =>
    regionA.regionName.localeCompare(regionB.regionName)
  )
  return productsGrouped.reduce((list, metric) => {
    if (metric.productSlug === product.productSlug) {
      const unit = METRIC_SLUGS[metric.metricSlug]?.unit
      list.push({
        service: METRIC_SLUGS[metric.metricSlug]?.title,
        slug: metric.metricSlug,
        quantity: formatUnitValue(metric.accounted, unit),
        price: 0,
        data: mapRegionMetrics(metric, productsGroupedByRegion, 0, unit)
      })
    }
    return list
  }, [])
}

const mapRegionMetrics = (metric, productsGroupedByRegion, currency, unit) => {
  const EPSILON = 1e-9

  const hasNoRegionDuplicatingParent = productsGroupedByRegion.some((regionMetric) => {
    if (
      regionMetric.productSlug !== metric.productSlug ||
      regionMetric.metricSlug !== metric.metricSlug
    ) {
      return false
    }

    if (regionMetric.regionName !== 'No Region') {
      return false
    }

    const parentAccounted = Number(metric.accounted || 0)
    const noRegionAccounted = Number(regionMetric.accounted || 0)
    return Math.abs(noRegionAccounted - parentAccounted) <= EPSILON
  })

  if (hasNoRegionDuplicatingParent) {
    return []
  }

  return productsGroupedByRegion.reduce((list, regionMetric) => {
    if (
      regionMetric.productSlug === metric.productSlug &&
      regionMetric.metricSlug === metric.metricSlug
    ) {
      list.push({
        country: regionMetric.regionName,
        quantity: formatUnitValue(regionMetric.accounted, unit),
        price: 0,
        slug: regionMetric.metricSlug
      })
    }
    return list
  }, [])
}

export const joinEdgeApplicationWithTieredCache = (services) => {
  const edgeApplicationService = services.find((service) => service.slug === 'edge_application')
  const tieredCacheServiceIndex = services.findIndex((service) => service.slug === 'tiered_cache')
  const botManagerServiceIndex = services.findIndex((service) => service.slug === 'bot_manager')

  if (!edgeApplicationService || tieredCacheServiceIndex === -1) return services

  const edgeDataTransferDescription = edgeApplicationService.descriptions.find(
    (desc) => desc.slug === 'data_transferred'
  )

  const tieredCacheService = services[tieredCacheServiceIndex]
  const tieredCacheDataTransferDescription = tieredCacheService.descriptions.find(
    (desc) => desc.slug === 'tiered_cache_data_transferred'
  )

  if (!edgeDataTransferDescription || !tieredCacheDataTransferDescription) return services

  const parseQuantityValue = (qtd) => parseFloat(qtd.replace(/,/g, '').replace(' GB', ''))

  const edgeTotalDataTransfer = parseQuantityValue(edgeDataTransferDescription.quantity)
  const tieredCacheTotalDataTransfer = parseQuantityValue(
    tieredCacheDataTransferDescription.quantity
  )
  const combinedTotalDataTransfer = edgeTotalDataTransfer + tieredCacheTotalDataTransfer

  edgeDataTransferDescription.quantity = formatUnitValue(combinedTotalDataTransfer, 'GB')

  tieredCacheDataTransferDescription.data.forEach((tieredCountryData) => {
    const tieredCountryTransfer = parseQuantityValue(tieredCountryData.quantity)
    const edgeCountryData = edgeDataTransferDescription.data.find(
      (item) => item.country === tieredCountryData.country
    )

    if (edgeCountryData) {
      const edgeQty = parseQuantityValue(edgeCountryData.quantity)
      const newQty = edgeQty + tieredCountryTransfer
      edgeCountryData.quantity = formatUnitValue(newQty, 'GB')
    } else {
      edgeDataTransferDescription.data.push({
        country: tieredCountryData.country,
        quantity: formatUnitValue(tieredCountryTransfer, 'GB'),
        price: tieredCountryData.price,
        slug: 'data_transferred'
      })
    }
  })

  const indicesToRemove = [tieredCacheServiceIndex, botManagerServiceIndex].sort(
    (first, second) => second - first
  )

  indicesToRemove.forEach((index) => {
    if (index !== -1) {
      services.splice(index, 1)
    }
  })

  return services
}
