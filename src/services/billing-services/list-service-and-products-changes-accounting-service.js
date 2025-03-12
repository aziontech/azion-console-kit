import { formatUnitValue } from '@/helpers'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountingBaseUrl } from './make-accounting-base-url'

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
  const shouldFilter =
    groupParams.length === 2 &&
    groupParams.includes('productSlug') &&
    groupParams.includes('metricSlug')
  const filteredData = shouldFilter ? data.filter((item) => item.accounted) : data

  const groupedMap = filteredData.reduce((groupedData, item) => {
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

  const productsGrouped = groupBy(accountingDetail, ['productSlug', 'metricSlug'])

  const productsGroupedByRegion = groupBy(accountingDetail, [
    'productSlug',
    'metricSlug',
    'regionName'
  ])

  const adaptedBody = mapProducts(productsGrouped, productsGroupedByRegion)
  const data = joinEdgeApplicationWithTieredCache(adaptedBody)

  return { body: data, statusCode }
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
  ddos_protection_unlimited: { title: 'DDoS Protection Unlimited', unit: 'Days' },
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
      uniqueProducts.push({
        service: PRODUCT_NAMES[product.productSlug],
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

const joinEdgeApplicationWithTieredCache = (services) => {
  const edgeApplicationService = services.find((service) => service.slug === 'edge_application')
  const tieredCacheServiceIndex = services.findIndex((service) => service.slug === 'tiered_cache')

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
  const tieredCacheTotalDataTransfer = parseQuantityValue(tieredCacheDataTransferDescription.quantity)
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

  services.splice(tieredCacheServiceIndex, 1)

  return services
}
