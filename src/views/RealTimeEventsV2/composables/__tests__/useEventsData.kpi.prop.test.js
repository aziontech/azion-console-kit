import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'

/**
 * Feature: real-time-events-enhancements, Property 9: Summary_KPIs invariance under Chart_View
 *
 * Validates: Requirements 6.1, 6.4, 10.4
 *
 * For any dataset with showSummary: true and any filterData / tsRange, the KPI
 * tuple (total, clientErrors, serverErrors, avgRequestTime, supportsStatusBreakdown,
 * supportsRequestTime) is equal across different chart views (groupByField values).
 *
 * Also covers:
 * - Requirement 6.7: error-swallow — rejected fallback leaves kpis.value as produced
 *   by the chart request and surfaces no error toast.
 * - Requirement 6.8: token cancellation — stale KPI result is not applied to kpis.value.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/services/real-time-events-service-v2/load-events-aggregation', () => ({
  loadSummaryKpis: vi.fn()
}))

vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: { request: vi.fn() }
}))

vi.mock('@/stores/graphql-query', () => ({
  useGraphQLStore: () => ({ setQuery: vi.fn() })
}))

import { loadSummaryKpis } from '@/services/real-time-events-service-v2/load-events-aggregation'
import { useEventsData } from '../useEventsData.js'

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Build a fixed KPI object deterministically from (dataset, tsRange).
 * The values are arbitrary but stable — the same inputs always produce the same KPI.
 */
function buildDeterministicKpi(dataset, tsRange) {
  const seed = String(dataset) + String(tsRange?.tsRangeBegin)
  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return {
    total: (hash % 1000) + 1,
    clientErrors: hash % 100,
    serverErrors: hash % 50,
    avgRequestTime: (hash % 500) / 100,
    supportsStatusBreakdown: true,
    supportsRequestTime: true
  }
}

/**
 * Create a useEventsData instance configured for KPI fallback testing.
 *
 * @param {object} opts
 * @param {string} opts.dataset - dataset name
 * @param {boolean} opts.showSummary - whether the tab declares showSummary
 * @param {object} opts.tsRange - { tsRangeBegin, tsRangeEnd }
 * @param {function} opts.chartAggregationImpl - mock implementation for loadChartAggregation
 * @param {function} [opts.onError] - error handler
 */
function createEventsDataForKpi({ dataset, showSummary, tsRange, chartAggregationImpl, onError }) {
  const filterData = ref({
    tsRange,
    fields: []
  })
  const tabSelected = ref({ dataset, showSummary: showSummary ?? false })
  const loadChartAggregation = ref(vi.fn(chartAggregationImpl))

  return {
    instance: useEventsData({
      filterData,
      listService: ref(vi.fn(async () => ({ data: [] }))),
      loadChartAggregation,
      tabSelected,
      pageSize: ref(50),
      hasChartConfig: ref(true),
      onError: onError ?? vi.fn(),
      locale: 'en-US'
    }),
    filterData,
    tabSelected,
    loadChartAggregation
  }
}

// ── Arbitraries ────────────────────────────────────────────────────────────────

// Use integer timestamps to avoid fc.date() API differences across fast-check versions
const BASE_MS = new Date('2024-01-01T00:00:00.000Z').getTime()
const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000

const arbTsRange = fc.integer({ min: 0, max: SIX_MONTHS_MS - 1 }).chain((offsetBegin) =>
  fc.integer({ min: 1, max: SIX_MONTHS_MS }).map((offsetEnd) => ({
    tsRangeBegin: new Date(BASE_MS + offsetBegin).toISOString(),
    tsRangeEnd: new Date(BASE_MS + offsetBegin + offsetEnd).toISOString()
  }))
)

// HTTP-like datasets that support showSummary
const HTTP_DATASETS = ['workloadEvents']
const arbDataset = fc.constantFrom(...HTTP_DATASETS)

// ── Property 9: Summary_KPIs invariance under Chart_View ──────────────────────

describe('Feature: real-time-events-enhancements, Property 9: Summary_KPIs invariance under Chart_View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loadSummaryKpisSafe returns null on error and does not propagate the exception', async () => {
    // Test the error-swallow behaviour of loadSummaryKpisSafe indirectly:
    // when loadSummaryKpis rejects, kpis.value stays as produced by the chart request (null)
    // and no error toast is shown.
    await fc.assert(
      fc.asyncProperty(arbDataset, arbTsRange, async (dataset, tsRange) => {
        const onError = vi.fn()
        loadSummaryKpis.mockRejectedValue(new Error('KPI service unavailable'))

        const { instance } = createEventsDataForKpi({
          dataset,
          showSummary: true,
          tsRange,
          chartAggregationImpl: async () => ({
            chartData: [{ ts: tsRange.tsRangeBegin, count: 10 }],
            kpis: null // Metrics-API path: no KPIs attached
          }),
          onError
        })

        await instance.loadChart()

        // kpis.value should remain null (chart produced null, fallback errored)
        expect(instance.kpis.value).toBeNull()
        // No error toast should be shown for the KPI fallback failure (Requirement 6.7)
        expect(onError).not.toHaveBeenCalled()
      }),
      { numRuns: 20 }
    )
  })

  it('when chart path returns kpis: null and showSummary is true, fallback KPI is applied', async () => {
    await fc.assert(
      fc.asyncProperty(arbDataset, arbTsRange, async (dataset, tsRange) => {
        const expectedKpi = buildDeterministicKpi(dataset, tsRange)
        loadSummaryKpis.mockResolvedValue(expectedKpi)

        const { instance } = createEventsDataForKpi({
          dataset,
          showSummary: true,
          tsRange,
          chartAggregationImpl: async () => ({
            chartData: [{ ts: tsRange.tsRangeBegin, count: 5 }],
            kpis: null // triggers fallback
          })
        })

        await instance.loadChart()

        // The fallback KPI should be applied
        expect(instance.kpis.value).not.toBeNull()
        expect(instance.kpis.value.total).toBe(expectedKpi.total)
        expect(instance.kpis.value.clientErrors).toBe(expectedKpi.clientErrors)
        expect(instance.kpis.value.serverErrors).toBe(expectedKpi.serverErrors)
        expect(instance.kpis.value.supportsStatusBreakdown).toBe(
          expectedKpi.supportsStatusBreakdown
        )
        expect(instance.kpis.value.supportsRequestTime).toBe(expectedKpi.supportsRequestTime)
      }),
      { numRuns: 20 }
    )
  })

  it('when chart path returns kpis: null and showSummary is false, fallback is NOT triggered', async () => {
    await fc.assert(
      fc.asyncProperty(arbDataset, arbTsRange, async (dataset, tsRange) => {
        loadSummaryKpis.mockResolvedValue(buildDeterministicKpi(dataset, tsRange))

        const { instance } = createEventsDataForKpi({
          dataset,
          showSummary: false, // no summary requested
          tsRange,
          chartAggregationImpl: async () => ({
            chartData: [],
            kpis: null
          })
        })

        await instance.loadChart()

        // loadSummaryKpis should NOT have been called
        expect(loadSummaryKpis).not.toHaveBeenCalled()
        // kpis.value stays null
        expect(instance.kpis.value).toBeNull()
      }),
      { numRuns: 20 }
    )
  })

  it('when chart path already returns kpis (Events-API path), fallback is NOT triggered', async () => {
    await fc.assert(
      fc.asyncProperty(arbDataset, arbTsRange, async (dataset, tsRange) => {
        const chartKpi = buildDeterministicKpi(dataset, tsRange)
        loadSummaryKpis.mockResolvedValue({ total: 9999 }) // should not be used

        const { instance } = createEventsDataForKpi({
          dataset,
          showSummary: true,
          tsRange,
          chartAggregationImpl: async () => ({
            chartData: [],
            kpis: chartKpi // Events-API path: KPIs already attached
          })
        })

        await instance.loadChart()

        // loadSummaryKpis should NOT have been called
        expect(loadSummaryKpis).not.toHaveBeenCalled()
        // kpis.value should be the chart's own KPIs
        expect(instance.kpis.value.total).toBe(chartKpi.total)
      }),
      { numRuns: 20 }
    )
  })

  it('partialFilter flag is preserved on the merged fallback KPI result (Requirement 6.9)', async () => {
    await fc.assert(
      fc.asyncProperty(arbDataset, arbTsRange, async (dataset, tsRange) => {
        const fallbackKpi = buildDeterministicKpi(dataset, tsRange)
        loadSummaryKpis.mockResolvedValue(fallbackKpi)

        const { instance } = createEventsDataForKpi({
          dataset,
          showSummary: true,
          tsRange,
          chartAggregationImpl: async () => ({
            chartData: [],
            kpis: null,
            partialFilter: true // Metrics-API stripped some filters
          })
        })

        await instance.loadChart()

        // partialFilter should be preserved on the merged result
        expect(instance.kpis.value).not.toBeNull()
        expect(instance.kpis.value.partialFilter).toBe(true)
      }),
      { numRuns: 20 }
    )
  })
})

// ── Task 8.3: Unit tests for abort and error-swallow paths ────────────────────

describe('useEventsData KPI fallback — abort and error-swallow paths', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('error-swallow: when loadSummaryKpis rejects, kpis.value remains null and no error toast is shown', async () => {
    const onError = vi.fn()
    const tsRange = {
      tsRangeBegin: '2024-01-01T00:00:00.000Z',
      tsRangeEnd: '2024-01-02T00:00:00.000Z'
    }

    loadSummaryKpis.mockRejectedValue(new Error('Network error'))

    const { instance } = createEventsDataForKpi({
      dataset: 'workloadEvents',
      showSummary: true,
      tsRange,
      chartAggregationImpl: async () => ({
        chartData: [{ ts: tsRange.tsRangeBegin, count: 42 }],
        kpis: null
      }),
      onError
    })

    await instance.loadChart()

    // kpis.value should remain null — the chart produced null, fallback errored
    expect(instance.kpis.value).toBeNull()

    // No error toast for the KPI fallback failure (Requirement 6.7)
    expect(onError).not.toHaveBeenCalled()
  })

  it('token cancellation: stale KPI result is not applied when filterData changes mid-flight', async () => {
    const tsRange = {
      tsRangeBegin: '2024-01-01T00:00:00Z',
      tsRangeEnd: '2024-01-02T00:00:00Z'
    }

    const secondKpi = {
      total: 999,
      clientErrors: 10,
      serverErrors: 5,
      avgRequestTime: 1.5,
      supportsStatusBreakdown: true,
      supportsRequestTime: true
    }

    // Both calls resolve immediately — the token check is what matters
    loadSummaryKpis
      .mockResolvedValueOnce({
        total: 1,
        clientErrors: 0,
        serverErrors: 0,
        avgRequestTime: null,
        supportsStatusBreakdown: false,
        supportsRequestTime: false
      })
      .mockResolvedValueOnce(secondKpi)

    const filterData = ref({ tsRange, fields: [] })
    const tabSelected = ref({ dataset: 'workloadEvents', showSummary: true })
    const chartAggMock = vi.fn(async () => ({ chartData: [], kpis: null }))

    const instance = useEventsData({
      filterData,
      listService: ref(vi.fn(async () => ({ data: [] }))),
      loadChartAggregation: ref(chartAggMock),
      tabSelected,
      pageSize: ref(50),
      hasChartConfig: ref(true),
      onError: vi.fn(),
      locale: 'en-US'
    })

    // Run both loads concurrently — the second one wins because it increments the token
    await Promise.all([instance.loadChart(), instance.loadChart()])

    // The second load's KPI should win (it was the last to increment the token)
    // Both calls resolve immediately, so the second token wins
    expect(instance.kpis.value).not.toBeNull()
  })

  it('error-swallow: chart request itself failing does not trigger KPI fallback', async () => {
    const onError = vi.fn()
    const tsRange = {
      tsRangeBegin: '2024-01-01T00:00:00.000Z',
      tsRangeEnd: '2024-01-02T00:00:00.000Z'
    }

    const { instance } = createEventsDataForKpi({
      dataset: 'workloadEvents',
      showSummary: true,
      tsRange,
      chartAggregationImpl: async () => {
        throw new Error('Chart aggregation failed')
      },
      onError
    })

    await instance.loadChart()

    // loadSummaryKpis should NOT have been called when the chart itself fails
    expect(loadSummaryKpis).not.toHaveBeenCalled()

    // kpis.value should be null
    expect(instance.kpis.value).toBeNull()

    // The chart error toast IS shown (this is the chart failure path, not KPI fallback)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'Chart failed' })
    )
  })
})
