/**
 * Task 11.4* — Metrics query applies only the supported AQL subset.
 *
 * Requirement 6.1 / Property 5:
 *   When building the Metrics query, `useMetricsChart` must forward only the
 *   filter fields expressible in the active Metrics dataset (supported-or-drop
 *   via `buildForTarget` + `resolveCapabilityTarget`). Unsupported fields are
 *   dropped from the query and flip `partial`; a fully-supported set leaves
 *   `partial=false` and forwards every field.
 *
 * We assert on the `config` the composable hands to the service boundary: it
 * carries a `metricsFilter` built from the supported subset only, so no
 * unsupported key can ever reach the Metrics API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, effectScope } from 'vue'

const { loadMetricsFallback, loadMetricsSeries, loadFromEventsApi, loadMetricsAggregation } =
  vi.hoisted(() => ({
    loadMetricsFallback: vi.fn(),
    loadMetricsSeries: vi.fn(),
    loadFromEventsApi: vi.fn(),
    loadMetricsAggregation: vi.fn()
  }))

const { resolveChartApi } = vi.hoisted(() => ({ resolveChartApi: vi.fn(() => 'events') }))

vi.mock('@/services/real-time-events-service-v2/metrics-chart-service', () => ({
  loadMetricsFallback,
  loadMetricsSeries,
  loadFromEventsApi,
  loadMetricsAggregation,
  pivotGroupedData: vi.fn()
}))

vi.mock('@/services/real-time-events-service-v2/chart-api-router', () => ({
  resolveChartApi
}))

vi.mock('@/modules/filter-loaders/dataset-fields-loader', () => ({
  loadAggregableFields: vi.fn(() => Promise.resolve(null)),
  getAggregableFields: vi.fn(() => null)
}))

import { useMetricsChart } from '../useMetricsChart'

const flush = async (times = 6) => {
  for (let tick = 0; tick < times; tick += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve()
  }
}

const makeTsRange = () => ({
  tsRangeBegin: new Date('2024-01-01T00:00:00.000Z'),
  tsRangeEnd: new Date('2024-01-01T01:00:00.000Z')
})

// httpMetrics aggregation path → loadMetricsAggregation. `status`/`host` are
// registered filterable fields; `httpUserAgent`/`requestUri` are not.
const aggConfig = { metricsDataset: 'httpMetrics', aggregation: 'requests' }

// botManagerMetrics series path → loadMetricsSeries. None of the HTTP filter
// fields are registered for this dataset → everything is dropped.
const seriesConfig = {
  metricsApiSeries: {
    metricsDataset: 'botManagerMetrics',
    series: [{ name: 'bad bot', aggregate: 'sum: requests', filters: { classifiedEq: 'bad bot' } }]
  }
}

const mountMetricsChart = (filterData, options) => {
  const scope = effectScope()
  let api
  scope.run(() => {
    api = useMetricsChart(filterData, options)
  })
  return { ...api, scope }
}

/** Advance the 50ms debounce and flush the awaited runLoad continuation. */
const runOnce = async () => {
  vi.advanceTimersByTime(50)
  await flush()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  resolveChartApi.mockReturnValue('events')
  loadMetricsAggregation.mockResolvedValue([{ ts: 1 }])
  loadMetricsSeries.mockResolvedValue([{ ts: 1 }])
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useMetricsChart — applies only the supported AQL subset', () => {
  it('drops unsupported fields from the metrics query and sets partial=true', async () => {
    const filterData = ref({
      tsRange: makeTsRange(),
      fields: [
        { valueField: 'status', operator: 'Eq', value: '200', type: 'int' },
        { valueField: 'host', operator: 'Eq', value: 'a.com', type: 'string' },
        // Not registered for httpMetrics → must be dropped.
        { valueField: 'httpUserAgent', operator: 'Eq', value: 'curl', type: 'string' },
        { valueField: 'requestUri', operator: 'In', value: ['/x'], type: 'string' }
      ]
    })
    const { partial, load } = mountMetricsChart(filterData)

    load(aggConfig)
    await runOnce()

    expect(loadMetricsAggregation).toHaveBeenCalledTimes(1)
    const [forwardedConfig] = loadMetricsAggregation.mock.calls[0]
    const built = forwardedConfig.metricsFilter
    const keys = [...Object.keys(built.and || {}), ...Object.keys(built.in || {})]

    // Supported fields survive.
    expect(keys).toContain('statusEq')
    expect(keys).toContain('hostEq')
    // Unsupported fields never reach the query.
    expect(keys.some((key) => key.startsWith('httpUserAgent'))).toBe(false)
    expect(keys.some((key) => key.startsWith('requestUri'))).toBe(false)

    // Something was dropped → divergence flagged.
    expect(partial.value).toBe(true)
  })

  it('forwards every field and keeps partial=false when all are supported', async () => {
    const filterData = ref({
      tsRange: makeTsRange(),
      fields: [
        { valueField: 'status', operator: 'Gte', value: '200', type: 'int' },
        { valueField: 'host', operator: 'In', value: ['a', 'b'], type: 'string' }
      ]
    })
    const { partial, load } = mountMetricsChart(filterData)

    load(aggConfig)
    await runOnce()

    const [forwardedConfig] = loadMetricsAggregation.mock.calls[0]
    expect(forwardedConfig.metricsFilter).toEqual({
      and: { statusGte: 200 },
      in: { host: ['a', 'b'] }
    })
    expect(partial.value).toBe(false)
  })

  it('drops all fields for a dataset that registers none of them (partial=true)', async () => {
    const filterData = ref({
      tsRange: makeTsRange(),
      fields: [
        { valueField: 'status', operator: 'Eq', value: '200', type: 'int' },
        { valueField: 'host', operator: 'Eq', value: 'a.com', type: 'string' }
      ]
    })
    const { partial, load } = mountMetricsChart(filterData)

    load(seriesConfig)
    await runOnce()

    expect(loadMetricsSeries).toHaveBeenCalledTimes(1)
    const [forwardedConfig] = loadMetricsSeries.mock.calls[0]
    expect(forwardedConfig.metricsFilter).toEqual({})
    expect(partial.value).toBe(true)
  })

  it('keeps partial=false with no active fields (nothing to drop)', async () => {
    const filterData = ref({ tsRange: makeTsRange(), fields: [] })
    const { partial, load } = mountMetricsChart(filterData)

    load(aggConfig)
    await runOnce()

    const [forwardedConfig] = loadMetricsAggregation.mock.calls[0]
    expect(forwardedConfig.metricsFilter).toEqual({})
    expect(partial.value).toBe(false)
  })
})
