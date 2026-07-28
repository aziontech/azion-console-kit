import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useEventsData } from '../useEventsData.js'
import { loadEventsCount } from '@/services/real-time-events-service-v2/load-events-count'

vi.mock('@/services/real-time-events-service-v2/load-events-count', () => ({
  loadEventsCount: vi.fn(async () => 4242)
}))

vi.mock('@/stores/graphql-query', () => ({
  useGraphQLStore: () => ({ setQuery: vi.fn() })
}))

const HOUR_MS = 60 * 60 * 1000

/**
 * P2 — count source selection. For rollup-routed ranges (>30min) whose active
 * filter fully translates to the Metrics dataset, the chart-summary total (the
 * pre-aggregated rollup) feeds the badge and the raw-events full-range count
 * query is SKIPPED. Every other combination keeps the raw count, including a
 * fallback re-fire when the summary this load counted on fails to deliver.
 */
function setup({
  dataset = 'workloadEvents',
  rangeMs = 3 * 24 * HOUR_MS,
  fields = [{ valueField: 'host', operator: 'Eq', value: 'example.com', type: 'string' }],
  hasChart = true,
  chartFails = false
} = {}) {
  const now = Date.now()
  const rows = Array.from({ length: 3 }, (_unused, idx) => {
    const ts = new Date(now - (idx + 1) * 1000).toISOString()
    return { id: `r${idx}`, ts, tsFormat: ts, summary: [{ key: 'host', value: `h-${idx}` }] }
  })
  const listService = vi.fn(async () => ({ data: rows }))
  const loadChartAggregation = ref(
    vi.fn(async () => {
      if (chartFails) throw new Error('metrics down')
      return {
        chartData: [{ ts: new Date(now - HOUR_MS).toISOString(), count: 5555 }],
        kpis: { total: 5555, supportsStatusBreakdown: true, supportsRequestTime: true },
        partialFilter: false
      }
    })
  )

  const instance = useEventsData({
    filterData: ref({
      tsRange: {
        tsRangeBegin: new Date(now - rangeMs).toISOString(),
        tsRangeEnd: new Date(now).toISOString()
      },
      fields
    }),
    listService: ref(listService),
    loadChartAggregation,
    tabSelected: ref({ dataset }),
    pageSize: ref(3),
    hasChartConfig: ref(hasChart),
    onError: vi.fn(),
    locale: 'en-US'
  })

  return { instance }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('useEventsData — count source: rollup total vs raw-events count (P2)', () => {
  beforeEach(() => {
    vi.mocked(loadEventsCount).mockClear()
  })

  it('rollup-covered filter on a >30min range: raw count SKIPPED, badge fed by the rollup total', async () => {
    const { instance } = setup()

    await instance.load()
    await flush()

    expect(loadEventsCount).not.toHaveBeenCalled()
    expect(instance.recordsFound.value).toBe('5,555')
  })

  it('filter with a field the Metrics dataset does not accept: raw count runs', async () => {
    const { instance } = setup({
      fields: [{ valueField: 'httpUserAgent', operator: 'Like', value: 'bot', type: 'string' }]
    })

    await instance.load()
    await flush()

    expect(loadEventsCount).toHaveBeenCalledTimes(1)
  })

  it('short range (≤30min → Events API): raw count runs', async () => {
    const { instance } = setup({ rangeMs: 20 * 60 * 1000 })

    await instance.load()
    await flush()

    expect(loadEventsCount).toHaveBeenCalledTimes(1)
  })

  it('chart aggregation failure: the skipped raw count RE-FIRES so the badge never starves', async () => {
    const { instance } = setup({ chartFails: true })

    await instance.load()
    await flush()

    expect(loadEventsCount).toHaveBeenCalledTimes(1)
    expect(instance.recordsFound.value).toBe('4,242')
  })

  it('no chart configured for the tab: raw count runs (no summary would ever arrive)', async () => {
    const { instance } = setup({ hasChart: false })

    await instance.load()
    await flush()

    expect(loadEventsCount).toHaveBeenCalledTimes(1)
  })

  it('dataset without a Metrics rollup (activityHistoryEvents): raw count runs', async () => {
    const { instance } = setup({ dataset: 'activityHistoryEvents' })

    await instance.load()
    await flush()

    expect(loadEventsCount).toHaveBeenCalledTimes(1)
  })
})
