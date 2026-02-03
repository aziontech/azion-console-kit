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

export const fetchDataTransferred = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery(
      'httpMetrics',
      ['dataTransferredTotal', 'dataTransferredOut', 'dataTransferredIn'],
      tsRangeBegin,
      tsRangeEnd
    )

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    return sumMetricValues(data, 'dataTransferredTotal')
  } catch (error) {
    throw new Error('Unable to load Data Transferred data')
  }
}

export const fetchRequests = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery(
      'httpMetrics',
      ['edgeRequestsTotalPerSecond'],
      tsRangeBegin,
      tsRangeEnd
    )

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    if (data.length === 0) return 0

    const totalRequestsPerSecond = data.reduce(
      (sum, item) => sum + (item.edgeRequestsTotalPerSecond || 0),
      0
    )
    const average = totalRequestsPerSecond / data.length
    return Math.round(average * 100) / 100
  } catch (error) {
    throw new Error('Unable to load Requests data')
  }
}

export const fetchBandwidthSaved = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery(
      'httpMetrics',
      ['bandwidthSavedData'],
      tsRangeBegin,
      tsRangeEnd
    )

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    return sumMetricValues(data, 'bandwidthSavedData')
  } catch (error) {
    throw new Error('Unable to load Bandwidth Saved data')
  }
}

export const fetchOffload = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery('httpMetrics', ['offload'], tsRangeBegin, tsRangeEnd)

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    if (data.length === 0) return 0

    const totalOffload = data.reduce((sum, item) => sum + (item.offload || 0), 0)
    return totalOffload / data.length
  } catch (error) {
    throw new Error('Unable to load Offload data')
  }
}

export const fetchWafRequestsBlocked = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery(
      'httpMetrics',
      ['wafRequestsBlocked'],
      tsRangeBegin,
      tsRangeEnd
    )

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    return sumMetricValues(data, 'wafRequestsBlocked')
  } catch (error) {
    throw new Error('Unable to load WAF Requests Blocked data')
  }
}

export const fetchWafRequestsAllowed = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery(
      'httpMetrics',
      ['wafRequestsAllowed'],
      tsRangeBegin,
      tsRangeEnd
    )

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    return sumMetricValues(data, 'wafRequestsAllowed')
  } catch (error) {
    throw new Error('Unable to load WAF Requests Allowed data')
  }
}

export const fetchWafRequestsThreat = async (tsRangeBegin, tsRangeEnd) => {
  try {
    const payload = buildGraphQLQuery(
      'httpMetrics',
      ['wafRequestsThreat'],
      tsRangeBegin,
      tsRangeEnd
    )

    const response = await metricsApi.post('', payload)
    const data = response.data?.data?.httpMetrics || []

    return sumMetricValues(data, 'wafRequestsThreat')
  } catch (error) {
    throw new Error('Unable to load WAF Requests Threat data')
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
