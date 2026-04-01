import {
  fetchAllWorkloadMetrics,
  fetchAllWafMetrics,
  fetchTopCountryThreat
} from './fetch-home-metrics'
import {
  calculateVariationPercentage,
  getPreviousTimeRange
} from '@/helpers/calculate-metric-variation'

export const fetchHomeMetrics = async (tsRangeBegin, tsRangeEnd) => {
  return fetchAllWorkloadMetrics(tsRangeBegin, tsRangeEnd)
}

export const fetchWafMetrics = async (tsRangeBegin, tsRangeEnd) => {
  const [wafMetrics, topCountryThreat] = await Promise.all([
    fetchAllWafMetrics(tsRangeBegin, tsRangeEnd),
    fetchTopCountryThreat(tsRangeBegin, tsRangeEnd)
  ])

  return {
    ...wafMetrics,
    topCountryThreat
  }
}

export const fetchHomeMetricsVariationOnly = async (currentMetrics, tsRangeBegin, tsRangeEnd) => {
  const { begin, end } = getPreviousTimeRange(tsRangeBegin, tsRangeEnd)
  const previousMetrics = await fetchHomeMetrics(begin, end)

  return {
    dataTransferredVariation: calculateVariationPercentage(
      currentMetrics.dataTransferred,
      previousMetrics.dataTransferred
    ),
    requestsVariation: calculateVariationPercentage(
      currentMetrics.requests,
      previousMetrics.requests
    ),
    bandwidthSavedVariation: calculateVariationPercentage(
      currentMetrics.bandwidthSaved,
      previousMetrics.bandwidthSaved
    ),
    offloadVariation: calculateVariationPercentage(currentMetrics.offload, previousMetrics.offload)
  }
}

export const fetchWafMetricsVariationOnly = async (currentMetrics, tsRangeBegin, tsRangeEnd) => {
  const { begin, end } = getPreviousTimeRange(tsRangeBegin, tsRangeEnd)
  const previousMetrics = await fetchWafMetrics(begin, end)

  return {
    requestsBlockedVariation: calculateVariationPercentage(
      currentMetrics.requestsBlocked,
      previousMetrics.requestsBlocked
    ),
    requestsAllowedVariation: calculateVariationPercentage(
      currentMetrics.requestsAllowed,
      previousMetrics.requestsAllowed
    ),
    requestsThreatVariation: calculateVariationPercentage(
      currentMetrics.requestsThreat,
      previousMetrics.requestsThreat
    )
  }
}
