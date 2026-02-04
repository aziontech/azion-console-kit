import {
  fetchDataTransferred,
  fetchRequests,
  fetchBandwidthSaved,
  fetchOffload,
  fetchWafRequestsBlocked,
  fetchWafRequestsAllowed,
  fetchWafRequestsThreat,
  fetchTopCountryThreat
} from './fetch-home-metrics'
import {
  calculateVariationPercentage,
  getPreviousTimeRange
} from '@/helpers/calculate-metric-variation'

export const fetchHomeMetrics = async (tsRangeBegin, tsRangeEnd) => {
  const [dataTransferred, requests, bandwidthSaved, offload] = await Promise.all([
    fetchDataTransferred(tsRangeBegin, tsRangeEnd),
    fetchRequests(tsRangeBegin, tsRangeEnd),
    fetchBandwidthSaved(tsRangeBegin, tsRangeEnd),
    fetchOffload(tsRangeBegin, tsRangeEnd)
  ])

  return {
    dataTransferred,
    requests,
    bandwidthSaved,
    offload
  }
}

export const fetchWafMetrics = async (tsRangeBegin, tsRangeEnd) => {
  const [requestsBlocked, requestsAllowed, requestsThreat, topCountryThreat] = await Promise.all([
    fetchWafRequestsBlocked(tsRangeBegin, tsRangeEnd),
    fetchWafRequestsAllowed(tsRangeBegin, tsRangeEnd),
    fetchWafRequestsThreat(tsRangeBegin, tsRangeEnd),
    fetchTopCountryThreat(tsRangeBegin, tsRangeEnd)
  ])

  return {
    requestsBlocked,
    requestsAllowed,
    requestsThreat,
    topCountryThreat
  }
}

export const fetchHomeMetricsWithVariation = async (tsRangeBegin, tsRangeEnd) => {
  const currentMetrics = await fetchHomeMetrics(tsRangeBegin, tsRangeEnd)
  const { begin, end } = getPreviousTimeRange(tsRangeBegin, tsRangeEnd)
  const previousMetrics = await fetchHomeMetrics(begin, end)

  return {
    dataTransferred: currentMetrics.dataTransferred,
    dataTransferredVariation: calculateVariationPercentage(
      currentMetrics.dataTransferred,
      previousMetrics.dataTransferred
    ),
    requests: currentMetrics.requests,
    requestsVariation: calculateVariationPercentage(
      currentMetrics.requests,
      previousMetrics.requests
    ),
    bandwidthSaved: currentMetrics.bandwidthSaved,
    bandwidthSavedVariation: calculateVariationPercentage(
      currentMetrics.bandwidthSaved,
      previousMetrics.bandwidthSaved
    ),
    offload: currentMetrics.offload,
    offloadVariation: calculateVariationPercentage(currentMetrics.offload, previousMetrics.offload)
  }
}

export const fetchWafMetricsWithVariation = async (tsRangeBegin, tsRangeEnd) => {
  const currentMetrics = await fetchWafMetrics(tsRangeBegin, tsRangeEnd)
  const { begin, end } = getPreviousTimeRange(tsRangeBegin, tsRangeEnd)
  const previousMetrics = await fetchWafMetrics(begin, end)

  return {
    requestsBlocked: currentMetrics.requestsBlocked,
    requestsBlockedVariation: calculateVariationPercentage(
      currentMetrics.requestsBlocked,
      previousMetrics.requestsBlocked
    ),
    requestsAllowed: currentMetrics.requestsAllowed,
    requestsAllowedVariation: calculateVariationPercentage(
      currentMetrics.requestsAllowed,
      previousMetrics.requestsAllowed
    ),
    requestsThreat: currentMetrics.requestsThreat,
    requestsThreatVariation: calculateVariationPercentage(
      currentMetrics.requestsThreat,
      previousMetrics.requestsThreat
    ),
    topCountryThreat: currentMetrics.topCountryThreat
  }
}

export {
  fetchDataTransferred,
  fetchRequests,
  fetchBandwidthSaved,
  fetchOffload,
  fetchWafRequestsBlocked,
  fetchWafRequestsAllowed,
  fetchWafRequestsThreat,
  fetchTopCountryThreat
}
