import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  toGraphQLScalar,
  pivotGroupedData,
  loadMetricsFallback,
  loadMetricsSeries,
  loadFromEventsApi,
  loadMetricsAggregation
} from '../metrics-chart-service'

vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: {
    request: vi.fn()
  }
}))
vi.mock('@/services/real-time-metrics-services/make-beholder-base-url', () => ({
  makeBeholderBaseUrl: () => 'v4/metrics/graphql'
}))
vi.mock('@/services/real-time-events-service/make-real-time-events-service', () => ({
  makeRealTimeEventsBaseUrl: () => 'v4/events/graphql'
}))

const { AxiosHttpClientAdapter } = await import('@/services/axios/AxiosHttpClientAdapter')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toGraphQLScalar', () => {
  it('wraps strings in double quotes', () => {
    expect(toGraphQLScalar('hello')).toBe('"hello"')
  })

  it('escapes double quotes inside strings', () => {
    expect(toGraphQLScalar('say "hi"')).toBe('"say \\"hi\\""')
  })

  it('returns raw numbers', () => {
    expect(toGraphQLScalar(42)).toBe('42')
    expect(toGraphQLScalar(3.14)).toBe('3.14')
  })

  it('returns boolean literals', () => {
    expect(toGraphQLScalar(true)).toBe('true')
    expect(toGraphQLScalar(false)).toBe('false')
  })

  it('returns null for null/undefined', () => {
    expect(toGraphQLScalar(null)).toBe('null')
    expect(toGraphQLScalar(undefined)).toBe('null')
  })

  it('handles arrays recursively', () => {
    expect(toGraphQLScalar(['a', 'b'])).toBe('["a", "b"]')
    expect(toGraphQLScalar([1, 'x'])).toBe('[1, "x"]')
  })

  it('converts NaN to string', () => {
    expect(toGraphQLScalar(NaN)).toBe('"NaN"')
  })
})

describe('pivotGroupedData', () => {
  it('pivots rows by field into one row per ts', () => {
    const rows = [
      { ts: '2024-01-01T00:00:00Z', category: 'A', count: 10 },
      { ts: '2024-01-01T00:00:00Z', category: 'B', count: 20 },
      { ts: '2024-01-01T00:01:00Z', category: 'A', count: 5 }
    ]
    const result = pivotGroupedData(rows, 'category', 'count')
    expect(result).toHaveLength(2)
    const row0 = result.find((r) => r.ts === '2024-01-01T00:00:00Z')
    expect(row0.A).toBe(10)
    expect(row0.B).toBe(20)
    const row1 = result.find((r) => r.ts === '2024-01-01T00:01:00Z')
    expect(row1.A).toBe(5)
    expect(row1.B).toBe(0) // backfilled
  })

  it('applies topN cap and drops tail categories', () => {
    const rows = [
      { ts: 't1', cat: 'big', val: 100 },
      { ts: 't1', cat: 'medium', val: 50 },
      { ts: 't1', cat: 'small', val: 1 }
    ]
    const result = pivotGroupedData(rows, 'cat', 'val', { topN: 2 })
    expect(result).toHaveLength(1)
    expect(result[0].big).toBe(100)
    expect(result[0].medium).toBe(50)
    expect(result[0].small).toBeUndefined()
  })

  it('returns empty array for empty input', () => {
    expect(pivotGroupedData([], 'cat', 'val')).toEqual([])
  })
})

describe('loadMetricsFallback', () => {
  it('returns { loaded: false } when fallback has no dataset', async () => {
    const config = { metricsApiFallback: { metricsDataset: '', fields: [] } }
    const result = await loadMetricsFallback(config, '2024-01-01T00:00:00Z', '2024-01-01T01:00:00Z')
    expect(result.loaded).toBe(false)
    expect(AxiosHttpClientAdapter.request).not.toHaveBeenCalled()
  })

  it('returns sorted rows for non-directFields fallback', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          httpMetrics: [
            { ts: '2024-01-01T00:01:00Z', wafRequestsBlocked: 5 },
            { ts: '2024-01-01T00:00:00Z', wafRequestsBlocked: 3 }
          ]
        }
      }
    })
    const config = {
      metricsApiFallback: {
        metricsDataset: 'httpMetrics',
        fields: ['wafRequestsBlocked']
      }
    }
    const result = await loadMetricsFallback(config, '2024-01-01T00:00:00Z', '2024-01-01T01:00:00Z')
    expect(result.loaded).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].ts).toBe('2024-01-01T00:00:00Z')
  })

  it('merges directFields aliases into one row per ts', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          fieldA: [{ ts: 't1', fieldA: 10 }],
          fieldB: [{ ts: 't1', fieldB: 20 }]
        }
      }
    })
    const config = {
      metricsApiFallback: {
        metricsDataset: 'httpMetrics',
        directFields: true,
        fields: ['fieldA', 'fieldB']
      }
    }
    const result = await loadMetricsFallback(config, 'begin', 'end')
    expect(result.loaded).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toEqual({ ts: 't1', fieldA: 10, fieldB: 20 })
  })

  it('throws on non-200 response', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 400,
      body: { detail: 'Bad request' }
    })
    const config = {
      metricsApiFallback: { metricsDataset: 'httpMetrics', fields: ['f1'] }
    }
    await expect(loadMetricsFallback(config, 'begin', 'end')).rejects.toEqual({
      reason: 'api-error',
      detail: 'Bad request'
    })
  })
})

describe('loadMetricsSeries', () => {
  it('returns empty array when metricsDataset is missing', async () => {
    const config = { metricsApiSeries: { metricsDataset: '' } }
    const result = await loadMetricsSeries(config, 'begin', 'end')
    expect(result).toEqual([])
  })

  it('handles groupByPivot path with labelMap', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          botManagerMetrics: [
            { ts: 't1', challengeSolved: 'true', sum: 10 },
            { ts: 't1', challengeSolved: 'false', sum: 5 }
          ]
        }
      }
    })
    const config = {
      metricsApiSeries: {
        metricsDataset: 'botManagerMetrics',
        groupByPivot: {
          field: 'challengeSolved',
          aggregate: 'sum: requests',
          labelMap: { true: 'Resolved', false: 'Unresolved' }
        }
      }
    }
    const result = await loadMetricsSeries(config, 'begin', 'end')
    expect(result).toHaveLength(1)
    expect(result[0].Resolved).toBe(10)
    expect(result[0].Unresolved).toBe(5)
  })

  it('handles series path with multiple aliases', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          s0: [{ ts: 't1', sum: 100 }],
          s1: [{ ts: 't1', sum: 200 }]
        }
      }
    })
    const config = {
      metricsApiSeries: {
        metricsDataset: 'botManagerMetrics',
        series: [
          { name: 'bad bot', aggregate: 'sum: requests', filters: { classifiedEq: 'bad bot' } },
          { name: 'good bot', aggregate: 'sum: requests', filters: { classifiedEq: 'good bot' } }
        ]
      }
    }
    const result = await loadMetricsSeries(config, 'begin', 'end')
    expect(result).toHaveLength(1)
    expect(result[0]['bad bot']).toBe(100)
    expect(result[0]['good bot']).toBe(200)
  })

  it('throws on non-200 response', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 500,
      body: { detail: 'Server error' }
    })
    const config = {
      metricsApiSeries: {
        metricsDataset: 'botManagerMetrics',
        series: [{ name: 'test', filters: {} }]
      }
    }
    await expect(loadMetricsSeries(config, 'begin', 'end')).rejects.toEqual({
      reason: 'api-error',
      detail: 'Server error'
    })
  })
})

describe('loadFromEventsApi', () => {
  it('returns empty array when no series or groupByPivot', async () => {
    const config = { eventsApi: { dataset: 'workloadEvents' } }
    const result = await loadFromEventsApi(config, 'begin', 'end')
    expect(result).toEqual([])
  })

  it('loads series data and merges per ts', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          wafRequestsAllowed: [{ ts: 't1', count: 10 }],
          wafRequestsBlocked: [{ ts: 't1', count: 5 }]
        }
      }
    })
    const config = {
      eventsApi: {
        dataset: 'workloadEvents',
        series: [
          { name: 'wafRequestsAllowed', filters: { wafBlockEq: '0' } },
          { name: 'wafRequestsBlocked', filters: { wafBlockEq: '1' } }
        ]
      }
    }
    const result = await loadFromEventsApi(config, 'begin', 'end')
    expect(result).toHaveLength(1)
    expect(result[0].wafRequestsAllowed).toBe(10)
    expect(result[0].wafRequestsBlocked).toBe(5)
  })

  it('applies eventsApiPostProcess when provided', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          _saved: [{ ts: 't1', count: 80 }],
          _total: [{ ts: 't1', count: 100 }]
        }
      }
    })
    const config = {
      eventsApi: {
        dataset: 'workloadEvents',
        series: [
          { name: '_saved', filters: {} },
          { name: '_total', filters: {} }
        ]
      },
      eventsApiPostProcess: (rows) =>
        rows.map((r) => ({ ts: r.ts, rate: r._total > 0 ? (r._saved / r._total) * 100 : 0 }))
    }
    const result = await loadFromEventsApi(config, 'begin', 'end')
    expect(result).toHaveLength(1)
    expect(result[0].rate).toBe(80)
  })

  it('uses Events API endpoint', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: { data: { s1: [] } }
    })
    const config = {
      eventsApi: {
        dataset: 'workloadEvents',
        series: [{ name: 's1', filters: {} }]
      }
    }
    await loadFromEventsApi(config, 'begin', 'end')
    expect(AxiosHttpClientAdapter.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'v4/events/graphql' })
    )
  })
})

describe('loadMetricsAggregation', () => {
  const noGuard = () => Promise.resolve(new Set())

  it('returns empty array when no fields and no aggregation', async () => {
    const config = { metricsDataset: 'httpMetrics', fields: [] }
    const result = await loadMetricsAggregation(config, 'begin', 'end', {
      loadAggregableFields: noGuard
    })
    expect(result).toEqual([])
  })

  it('throws schema-mismatch when no fields pass schema guard', async () => {
    const strictGuard = vi.fn().mockResolvedValue(new Set(['allowedField']))
    const config = { metricsDataset: 'httpMetrics', fields: ['unknownField'] }
    await expect(
      loadMetricsAggregation(config, 'begin', 'end', { loadAggregableFields: strictGuard })
    ).rejects.toEqual(
      expect.objectContaining({ reason: 'schema-mismatch' })
    )
  })

  it('handles aggregation response shape', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          httpMetrics: [
            { ts: 't1', sum: 100 },
            { ts: 't2', sum: 200 }
          ]
        }
      }
    })
    const config = { metricsDataset: 'httpMetrics', aggregation: 'requests' }
    const result = await loadMetricsAggregation(config, 'begin', 'end', {
      loadAggregableFields: noGuard
    })
    expect(result).toEqual([
      { ts: 't1', requests: 100 },
      { ts: 't2', requests: 200 }
    ])
  })

  it('handles aliases response shape', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          fieldA: [{ ts: 't1', sum: 10 }],
          fieldB: [{ ts: 't1', sum: 20 }]
        }
      }
    })
    const config = { metricsDataset: 'httpMetrics', fields: ['fieldA', 'fieldB'] }
    const result = await loadMetricsAggregation(config, 'begin', 'end', {
      loadAggregableFields: noGuard
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ ts: 't1', fieldA: 10, fieldB: 20 })
  })

  it('uses Metrics API endpoint', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: { data: { httpMetrics: [{ ts: 't1', sum: 1 }] } }
    })
    const config = { metricsDataset: 'httpMetrics', aggregation: 'requests' }
    await loadMetricsAggregation(config, 'begin', 'end', {
      loadAggregableFields: noGuard
    })
    expect(AxiosHttpClientAdapter.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'v4/metrics/graphql' })
    )
  })
})
