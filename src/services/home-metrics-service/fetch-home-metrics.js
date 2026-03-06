import axios from 'axios'

const metricsApi = axios.create({
  baseURL: '/v4/metrics/graphql'
})

metricsApi.defaults.headers.common['Content-Type'] = 'application/json'

const buildGraphQLQuery = (queryName, fields, tsRangeBegin, tsRangeEnd) => {
  const fieldsString = fields.join('\n    ')

  return {
    query: `
      query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
        ${queryName} (
          limit: 5000
          groupBy: [ts]
          orderBy: [ts_ASC]
          filter: {
            tsRange: {
              begin: $tsRange_begin
              end: $tsRange_end
            }
          }
        ) {
          ${fieldsString}
          ts
        }
      }
    `,
    variables: {
      tsRange_begin: tsRangeBegin,
      tsRange_end: tsRangeEnd
    }
  }
}

const sumMetricValues = (data, fieldName) => {
  if (!data || !Array.isArray(data)) return 0

  return data.reduce((sum, item) => {
    const value = item[fieldName]
    return sum + (typeof value === 'number' ? value : 0)
  }, 0)
}

const calculateAverage = (data, fieldName) => {
  if (!data || !Array.isArray(data) || data.length === 0) return 0

  const total = data.reduce((sum, item) => sum + (item[fieldName] || 0), 0)
  const average = total / data.length
  return Math.round(average * 100) / 100
}

export const fetchAllWorkloadMetrics = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery(
      'httpMetrics',
      ['dataTransferredTotal', 'edgeRequestsTotalPerSecond', 'bandwidthSavedData', 'offload'],
      tsRangeBegin,
      tsRangeEnd
    )

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    return {
      dataTransferred: sumMetricValues(data, 'dataTransferredTotal'),
      requests: calculateAverage(data, 'edgeRequestsTotalPerSecond'),
      bandwidthSaved: sumMetricValues(data, 'bandwidthSavedData'),
      offload: calculateAverage(data, 'offload')
    }
  } catch (error) {
    throw new Error('Unable to load Workload Metrics data')
  }
}

export const fetchAllWafMetrics = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery(
      'httpMetrics',
      ['wafRequestsBlocked', 'wafRequestsAllowed', 'wafRequestsThreat'],
      tsRangeBegin,
      tsRangeEnd
    )

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    return {
      requestsBlocked: sumMetricValues(data, 'wafRequestsBlocked'),
      requestsAllowed: sumMetricValues(data, 'wafRequestsAllowed'),
      requestsThreat: sumMetricValues(data, 'wafRequestsThreat')
    }
  } catch (error) {
    throw new Error('Unable to load WAF Metrics data')
  }
}

export const fetchTopCountryThreat = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = {
      query: `
        query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
          httpMetrics (
            limit: 20
            aggregate: {sum: requests}
            groupBy: [geolocCountryName]
            orderBy: [sum_DESC]
            filter: {
              tsRange: {
                begin: $tsRange_begin
                end: $tsRange_end
              }
              wafBlock: "1"
              wafLearning: "0"
            }
          ) {
            sum
            geolocCountryName
          }
        }
      `,
      variables: {
        tsRange_begin: tsRangeBegin,
        tsRange_end: tsRangeEnd
      }
    }

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    if (data.length === 0) return { country: 'N/A', requests: 0 }

    const topCountry = data[0]
    return {
      country: topCountry.geolocCountryName || 'Unknown',
      requests: topCountry.sum || 0
    }
  } catch (error) {
    throw new Error('Unable to load Top Country Threat data')
  }
}
