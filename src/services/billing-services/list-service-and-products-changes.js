import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'

export const listServiceAndProductsChangesService = async (billID) => {
  const payload = {
    query: `query getBillDetail {
      products: billDetail(
        aggregate: { sum: value }
        groupBy: [productSlug, metricSlug]
        orderBy: [productSlug_ASC],
        limit: 10000,
        filter: {
          billIdEq: ${billID}
        }
      ) {
        productSlug
        metricSlug
        accounted
        value: sum
        currency
      }
      product_detail: billDetail(
        aggregate: { sum: value }
        groupBy: [productSlug ,metricSlug, regionName]
        orderBy: [productSlug_ASC, metricSlug_ASC],
        limit: 10000,
        filter: {
          billIdEq: ${billID}
        }
      ) {
        productSlug
        metricSlug
        regionName
        accounted
        value: sum
        currency
      }
      products_accounted: billDetail(
        aggregate: { sum: accounted  }
        groupBy: [productSlug, metricSlug]
        orderBy: [productSlug_ASC],
      	limit: 10000,
        filter: {
          	billIdEq: ${billID}
        }
    ) {
    		productSlug
    		metricSlug
    		accounted: sum
    }
      product_detail_accounted: billDetail(
      aggregate: { sum: accounted }
      groupBy: [productSlug ,metricSlug, regionName]
      orderBy: [productSlug_ASC, metricSlug_ASC],
      limit: 10000,
      filter: {
  	    billIdEq: ${billID}
  	  }) {
        productSlug
        metricSlug
        regionName
        accounted: sum
  	  }
    }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeBillingBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { products, product_detail, products_accounted, product_detail_accounted } =
    httpResponse.body.data
  const statusCode = httpResponse.statusCode
  const data = []

  if (products.length === 0) return { body: [], statusCode }

  products.forEach((product, pos) => {
    const productIndex = data.findIndex((el) => el.slug === product.productSlug)

    if (productIndex === -1) {
      data.push(createProductData(product, products_accounted[pos]))
    } else {
      updateProductData(data[productIndex], product, products_accounted[pos])
    }
  })

  data.forEach((el) => {
    el.descriptions.forEach((desc) => {
      product_detail.forEach((prodDetail, pos) => {
        if (desc.slug === prodDetail.metricSlug) {
          desc.data.push(createProductDetailData(prodDetail, product_detail_accounted[pos]))
        }
      })
    })
  })

  return {
    body: data,
    statusCode
  }
}

const createProductData = (product, accounted) => ({
  service: replaceProductName(product.productSlug),
  value: product.value,
  slug: product.productSlug,
  descriptions: [
    {
      service: replaceMetricSlug(product.metricSlug),
      slug: product.metricSlug,
      quantity: accounted.accounted,
      price: product.value,
      data: []
    }
  ]
})

const updateProductData = (productData, product, accounted) => {
  productData.value += product.value
  const indexSlug = productData.descriptions.findIndex((el) => el.slug === product.metricSlug)

  if (indexSlug === -1) {
    productData.descriptions.push({
      service: replaceMetricSlug(product.metricSlug),
      slug: product.metricSlug,
      quantity: accounted.accounted,
      price: product.value,
      data: []
    })
  }
}

const createProductDetailData = (prodDetail, accounted) => ({
  country: prodDetail.regionName,
  quantity: accounted.accounted,
  price: parseFloat(prodDetail.value),
  slug: prodDetail.metricSlug
})

const replaceProductName = (product) => {
  const products = {
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

  return products[product] ?? product
}

const replaceMetricSlug = (metricSlug) => {
  const dataTransferredText = 'Total Data Transfered (per GB)'
  const requestText = 'Total Requests (per 10,000)'

  const slugs = {
    application_accelerator_data_transferred: dataTransferredText,
    requests: requestText,
    data_transferred: dataTransferredText,
    data_stream_requests: requestText,
    network_layer_protection_requests: requestText,
    tiered_cache_data_transferred: dataTransferredText,
    load_balancer_data_transferred: dataTransferredText,
    waf_requests: requestText,
    ddos_protection_20gbps: 'DDoS Protection 20Gbps',
    ddos_protection_50gbps: 'DDoS Protection 50Gbps',
    ddos_protection_data_transferred: dataTransferredText,
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

  return slugs[metricSlug] ?? metricSlug
}
