const CONNECTOR_PRODUCT_SLUG = 'connector'
const CONNECTOR_METRIC_PREFIX = `${CONNECTOR_PRODUCT_SLUG}_`

export const filterOutConnectorProducts = (products = []) => {
  return products.filter((item) => item.productSlug !== CONNECTOR_PRODUCT_SLUG)
}

export const filterOutConnectorMetrics = (items = []) => {
  return items.filter((item) => {
    if (item.productSlug === CONNECTOR_PRODUCT_SLUG) return false
    if (
      typeof item.metricSlug === 'string' &&
      item.metricSlug.startsWith(CONNECTOR_METRIC_PREFIX)
    ) {
      return false
    }
    return true
  })
}
