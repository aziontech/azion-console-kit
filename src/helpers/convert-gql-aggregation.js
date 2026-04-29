/**
 * Build a GraphQL aggregation query for Events datasets.
 * Similar to Metrics but adapted for Events API structure.
 *
 * @param {Object} options - The options object
 * @param {string} options.dataset - The dataset name (e.g., 'workloadEvents')
 * @param {Object} options.tsRange - Time range filter { tsRangeBegin, tsRangeEnd }
 * @param {Array} options.groupBy - Fields to group by (e.g., ['ts'])
 * @param {Object} options.aggregation - Aggregation config { count: 'rows' } or { sum: 'field' }
 * @param {Object} options.filters - Additional filters (and, in)
 * @param {number} options.limit - Query limit (default: 10000)
 * @param {string} options.orderBy - Order by clause (default: 'ts_ASC')
 * @returns {Object} The GraphQL query and variables
 */
function convertGQLAggregation({
  dataset,
  tsRange,
  groupBy = ['ts'],
  aggregation = { count: 'rows' },
  filters = {},
  limit = 10000,
  orderBy = 'ts_ASC'
}) {
  const variables = {}
  const filterLines = []

  // Build tsRange filter
  if (tsRange?.tsRangeBegin && tsRange?.tsRangeEnd) {
    variables.tsRange_begin = tsRange.tsRangeBegin
    variables.tsRange_end = tsRange.tsRangeEnd
    filterLines.push('tsRange: { begin: $tsRange_begin, end: $tsRange_end }')
  }

  // Build additional AND filters
  if (filters.and) {
    Object.entries(filters.and).forEach(([key, value]) => {
      const varName = `and_${key}`
      variables[varName] = value
      filterLines.push(`${key}: $${varName}`)
    })
  }

  // Build IN filters
  if (filters.in) {
    Object.entries(filters.in).forEach(([key, value]) => {
      const varName = `in_${key}`
      variables[varName] = Array.isArray(value)
        ? value.map((item) => String(item.value !== undefined ? item.value : item))
        : value
      const gqlKey = key.endsWith('In') ? key : `${key}In`
      filterLines.push(`${gqlKey}: $${varName}`)
    })
  }

  // Build aggregation string
  let aggregationStr = ''
  const aggregationFields = []
  if (aggregation) {
    const [[aggType, aggField]] = Object.entries(aggregation)
    aggregationStr = `aggregate: { ${aggType}: ${aggField} }`
    aggregationFields.push(aggType)
  }

  // Build groupBy string - Events API expects groupBy without brackets content for single field
  const groupByStr = groupBy.length ? `groupBy: [${groupBy.join(', ')}]` : ''

  // Build fields to return
  const returnFields = [...aggregationFields, ...groupBy].join('\n\t\t')

  // Build filter string
  const filterStr = filterLines.length
    ? `filter: {\n\t\t\t${filterLines.join('\n\t\t\t')}\n\t\t}`
    : ''

  // Build parameters - always include tsRange params
  const params = Object.keys(variables).map((key) => {
    const value = variables[key]
    let type
    if (key === 'tsRange_begin' || key === 'tsRange_end') {
      type = 'DateTime!'
    } else if (Array.isArray(value)) {
      type = '[String]'
    } else if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'Int' : 'Float'
    } else {
      type = 'String'
    }
    return `$${key}: ${type}`
  })

  // Build the query - handle case where params might be empty
  const paramsStr = params.length ? `(${params.join(', ')})` : ''

  const orderByStr = orderBy ? `orderBy: [${orderBy}]` : ''

  const query = `query ${paramsStr} {
\t${dataset} (
\t\tlimit: ${limit}
\t\t${aggregationStr}
\t\t${groupByStr}
\t\t${orderByStr}
\t\t${filterStr}
\t) {
\t\t${returnFields}
\t}
}`

  return {
    query,
    variables
  }
}

/**
 * Get interval for time bucketing based on time range duration.
 * Similar to Metrics' fill-result-query.js logic.
 *
 * @param {number} durationMs - Duration in milliseconds
 * @returns {string} Interval ('minute', 'hour', or 'day')
 */
function getQueryInterval(durationMs) {
  const TWO_AND_A_HALF_DAYS = 2.5 * 24 * 60 * 60 * 1000
  const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000

  if (durationMs < TWO_AND_A_HALF_DAYS) return 'minute'
  if (durationMs > SIXTY_DAYS) return 'day'
  return 'hour'
}

/**
 * Calculate the number of buckets based on interval and duration.
 *
 * @param {string} interval - The interval ('minute', 'hour', 'day')
 * @param {number} durationMs - Duration in milliseconds
 * @returns {number} Number of buckets
 */
function calculateBucketCount(interval, durationMs) {
  const MINUTE = 60 * 1000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR

  switch (interval) {
    case 'minute':
      return Math.min(Math.ceil(durationMs / MINUTE), 1440) // max 1 day of minutes
    case 'hour':
      return Math.min(Math.ceil(durationMs / HOUR), 720) // max 30 days of hours
    case 'day':
      return Math.min(Math.ceil(durationMs / DAY), 365) // max 1 year of days
    default:
      return 60
  }
}

export { convertGQLAggregation, getQueryInterval, calculateBucketCount }
