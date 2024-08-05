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

/**
 * @param {Array} firstData First array to group
 * @param {Array} secondData Second array to group
 * @param {Object} groupParams Parameters to group by
 * @returns {Array}
 * @description Groups two arrays of data by the given parameters.
 */
export const groupBy = (firstData, secondData, groupParams) => {
  const dataToGroup = [...firstData, ...secondData]
  const groupedMap = dataToGroup.reduce((groupedData, item) => {
    const key = groupParams.map((param) => item[param]).join('_')
    const valueGroup = groupedData[key] || {}

    groupedData[key] = { ...valueGroup, ...item }

    return groupedData
  }, {})

  return Object.values(groupedMap)
}

/**
 * @param {Array} products List of products
 * @param {Array} metricsGrouped List of metrics grouped by productSlug
 * @param {Array} regionMetricsGrouped List of metrics grouped by productSlug, metricSlug and region
 * @param {Boolean} withValue If true, the value of the metric will be included in the response
 * @returns {Array}
 * @description Maps the products with their respective metrics and grouped regions.
 */
const mapRegionMetrics = (metric, regionMetricsGrouped, withValue = false) => {
  return regionMetricsGrouped.reduce((list, regionMetric) => {
    if (
      regionMetric.productSlug === metric.productSlug &&
      regionMetric.metricSlug === metric.metricSlug
    ) {
      const mappedMetric = {
        country: regionMetric.regionName,
        quantity: regionMetric.accounted,
        slug: regionMetric.metricSlug,
        ...(withValue && { price: regionMetric.value })
      }
      list.push(mappedMetric)
    }
    return list
  }, [])
}
/**
 * @param {Array} [products=[]] List of products
 * @param {Array} [metricsGrouped=[]] List of metrics grouped by productSlug
 * @param {Array} [regionMetricsGrouped=[]] List of metrics grouped by productSlug, metricSlug and region
 * @param {Boolean} withValue If true, the value of the metric will be included in the response
 * @returns {Array} List of products with their respective metrics and grouped regions
 * @description Maps the products with their respective metrics and grouped regions.
 */
export const mapProductMetrics = (
  products = [],
  metricsGrouped = [],
  regionMetricsGrouped = [],
  withValue
) => {
  const productMap = metricsGrouped.reduce((newListResult, metric) => {
    const product = products?.find((item) => item.productSlug === metric.productSlug) || {}

    if (!newListResult[metric.productSlug]) {
      newListResult[metric.productSlug] = {
        service: PRODUCT_NAMES[metric.productSlug],
        slug: metric.productSlug,
        currency: product?.currency,
        price: product?.value,
        descriptions: []
      }
    }

    newListResult[metric.productSlug].descriptions.push({
      service: METRIC_SLUGS[metric.metricSlug],
      slug: metric.metricSlug,
      quantity: metric.accounted,
      ...(withValue && { price: metric.value }),
      data: mapRegionMetrics(metric, regionMetricsGrouped, withValue)
    })

    return newListResult
  }, {})

  return Object.values(productMap)
}
