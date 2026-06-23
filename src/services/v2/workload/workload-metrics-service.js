import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { WorkloadMetricsAdapter } from './workload-metrics-adapter'

const RANGE_PRESETS = {
  '1h': { hours: 1, label: 'Last 1 hour' },
  '24h': { hours: 24, label: 'Last 24 hours' },
  '7d': { hours: 24 * 7, label: 'Last 7 days' },
  '30d': { hours: 24 * 30, label: 'Last 30 days' }
}

const HOUR_IN_MS = 60 * 60 * 1000

const toBeholderFormat = (date) => date.toISOString().replace(/(\..+)/, '')

const computeRanges = (range) => {
  const windowMs = RANGE_PRESETS[range].hours * HOUR_IN_MS
  const now = new Date()
  const curBegin = new Date(now.getTime() - windowMs)
  const prevBegin = new Date(curBegin.getTime() - windowMs)

  return {
    curBegin: toBeholderFormat(curBegin),
    curEnd: toBeholderFormat(now),
    prevBegin: toBeholderFormat(prevBegin),
    prevEnd: toBeholderFormat(curBegin)
  }
}

const WORKLOAD_OVERVIEW_METRICS_QUERY = `
  query workloadOverviewMetrics(
    $curBegin: DateTime!
    $curEnd: DateTime!
    $prevBegin: DateTime!
    $prevEnd: DateTime!
    $configurationId: [String]!
  ) {
    curRequests: httpMetrics(limit: 1, aggregate: { sum: requests }, filter: { tsRange: { begin: $curBegin, end: $curEnd }, configurationIdIn: $configurationId }) { sum }
    curBandwidth: httpMetrics(limit: 5000, groupBy: [ts], orderBy: [ts_ASC], filter: { tsRange: { begin: $curBegin, end: $curEnd }, configurationIdIn: $configurationId }) { dataTransferredTotal }
    curLatency: httpMetrics(limit: 1, aggregate: { avg: requestTime }, filter: { tsRange: { begin: $curBegin, end: $curEnd }, configurationIdIn: $configurationId }) { avg }
    curErrors5xx: httpMetrics(limit: 1, aggregate: { sum: requests }, filter: { tsRange: { begin: $curBegin, end: $curEnd }, configurationIdIn: $configurationId, statusRange: { begin: 500, end: 599 } }) { sum }
    prevRequests: httpMetrics(limit: 1, aggregate: { sum: requests }, filter: { tsRange: { begin: $prevBegin, end: $prevEnd }, configurationIdIn: $configurationId }) { sum }
    prevBandwidth: httpMetrics(limit: 5000, groupBy: [ts], orderBy: [ts_ASC], filter: { tsRange: { begin: $prevBegin, end: $prevEnd }, configurationIdIn: $configurationId }) { dataTransferredTotal }
    prevLatency: httpMetrics(limit: 1, aggregate: { avg: requestTime }, filter: { tsRange: { begin: $prevBegin, end: $prevEnd }, configurationIdIn: $configurationId }) { avg }
    prevErrors5xx: httpMetrics(limit: 1, aggregate: { sum: requests }, filter: { tsRange: { begin: $prevBegin, end: $prevEnd }, configurationIdIn: $configurationId, statusRange: { begin: 500, end: 599 } }) { sum }
  }
`

export class WorkloadMetricsService extends BaseService {
  constructor() {
    super()
    this.adapter = WorkloadMetricsAdapter
    this.baseURL = 'v4/metrics/graphql'
  }

  #fetchMetrics = async (workloadId, params = {}) => {
    const range = RANGE_PRESETS[params.range] ? params.range : '24h'
    const { curBegin, curEnd, prevBegin, prevEnd } = computeRanges(range)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: {
        query: WORKLOAD_OVERVIEW_METRICS_QUERY,
        variables: {
          curBegin,
          curEnd,
          prevBegin,
          prevEnd,
          configurationId: [String(workloadId)]
        }
      }
    })

    return {
      body: this.adapter.transformOverviewMetrics(data?.data),
      range,
      rangeLabel: RANGE_PRESETS[range].label,
      generatedAt: new Date().toISOString()
    }
  }

  loadWorkloadMetricsService = async (workloadId, params = {}) => {
    const range = RANGE_PRESETS[params.range] ? params.range : '24h'
    const skipCache = params?.skipCache || false

    return await this.useEnsureQueryData(
      queryKeys.workload.metrics(workloadId, { range }),
      () => this.#fetchMetrics(workloadId, { range }),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  rangeOptions = Object.keys(RANGE_PRESETS).map((value) => ({
    label: value,
    value
  }))
}

export const workloadMetricsService = new WorkloadMetricsService()
