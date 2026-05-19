import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const RANGE_PRESETS = {
  '1h': { hours: 1, label: 'Last 1 hour' },
  '24h': { hours: 24, label: 'Last 24 hours' },
  '7d': { hours: 24 * 7, label: 'Last 7 days' },
  '30d': { hours: 24 * 30, label: 'Last 30 days' }
}

const hashSeed = (workloadId, range, key) => {
  const source = `${workloadId || 'wl'}:${range}:${key}`
  let hash = 0
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }
  return hash
}

const pseudoFloat = (workloadId, range, key, salt = 0) => {
  const hash = hashSeed(workloadId, range, `${key}:${salt}`)
  return (hash % 10000) / 10000
}

const formatNumber = (value, fraction = 1) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(fraction)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(fraction)}K`
  return value.toFixed(fraction)
}

const buildMetrics = (workloadId, range) => {
  const requestsBase = 8_000_000 + pseudoFloat(workloadId, range, 'requests') * 12_000_000
  const bandwidthBase = 350 + pseudoFloat(workloadId, range, 'bandwidth') * 900
  const latencyBase = 24 + pseudoFloat(workloadId, range, 'latency') * 40
  const errorBase = 0.05 + pseudoFloat(workloadId, range, 'errors') * 0.4

  const variation = (key) => {
    const raw = pseudoFloat(workloadId, range, key, 1) * 24 - 8
    return Number(raw.toFixed(2))
  }

  return [
    {
      key: 'requests',
      label: 'Requests',
      value: formatNumber(requestsBase, 1),
      unit: '',
      tooltip: 'Total HTTP requests served by this Workload.',
      variation: { value: variation('requests'), type: 'regular' }
    },
    {
      key: 'bandwidth',
      label: 'Bandwidth',
      value: formatNumber(bandwidthBase, 0),
      unit: 'GB',
      tooltip: 'Total data transferred from the edge to clients.',
      variation: { value: variation('bandwidth'), type: 'regular' }
    },
    {
      key: 'latency',
      label: 'p95 Latency',
      value: Math.round(latencyBase).toString(),
      unit: 'ms',
      tooltip: '95th-percentile response time at the edge.',
      variation: { value: variation('latency'), type: 'inverse' }
    },
    {
      key: 'errors',
      label: '5xx Errors',
      value: errorBase.toFixed(2),
      unit: '%',
      tooltip: 'Share of 5xx responses returned to clients.',
      variation: { value: variation('errors'), type: 'inverse' }
    }
  ]
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export class WorkloadMetricsService extends BaseService {
  // TODO: replace mock with real GraphQL call once endpoint is ready.
  // Should mirror fetchAllWorkloadMetrics but include `configurationIdIn: [workloadId]`
  // in the filter so metrics are scoped to a single Workload.
  // Reference: src/services/home-metrics-service/fetch-home-metrics.js
  #fetchMetrics = async (workloadId, params = {}) => {
    await sleep(220)
    const range = RANGE_PRESETS[params.range] ? params.range : '24h'
    return {
      body: buildMetrics(workloadId, range),
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
