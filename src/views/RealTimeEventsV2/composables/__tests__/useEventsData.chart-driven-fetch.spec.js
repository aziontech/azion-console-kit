import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useEventsData } from '../useEventsData.js'

vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: { request: vi.fn(async () => ({ statusCode: 200, body: { data: {} } })) }
}))

vi.mock('@/stores/graphql-query', () => ({
  useGraphQLStore: () => ({ setQuery: vi.fn() })
}))

const DAY = 24 * 60 * 60 * 1000

/**
 * The chart's first request already reports how many events exist in the
 * range+filter. The list loader reuses that total to avoid walking the range
 * window by window:
 *   - small, non-partial total → ONE newest→oldest query over the whole range
 *     (the API skips the empty span between "now" and the data on its own)
 *   - zero total → no list request at all
 */
describe('useEventsData — chart total drives the list fetch strategy', () => {
  function setup({ chartTotal, pageSize = 100, rows }) {
    const now = Date.now()
    // "This week" viewed mid-week: end is in the future.
    const begin = now - 3 * DAY
    const end = now + 3 * DAY

    const listService = vi.fn(async () => ({ data: rows ?? [] }))

    const loadChartAggregation = ref(
      vi.fn(async () => ({
        chartData:
          chartTotal > 0 ? [{ ts: new Date(now - DAY).toISOString(), count: chartTotal }] : [],
        kpis: {
          total: chartTotal,
          supportsStatusBreakdown: true,
          supportsRequestTime: true
        }
      }))
    )

    const instance = useEventsData({
      filterData: ref({
        tsRange: {
          tsRangeBegin: new Date(begin).toISOString(),
          tsRangeEnd: new Date(end).toISOString()
        },
        // No active filter → loadTotalCount stays out of the way; the chart
        // total is the only signal under test.
        fields: []
      }),
      listService: ref(listService),
      loadChartAggregation,
      tabSelected: ref({ dataset: 'test', showSummary: true }),
      pageSize: ref(pageSize),
      hasChartConfig: ref(true),
      onError: vi.fn(),
      locale: 'en-US'
    })

    return { instance, listService, now, begin }
  }

  it('sparse total → a single list query over the whole range, end clamped to now', async () => {
    const rows = Array.from({ length: 71 }, (unused, idx) => ({
      id: `e${idx}`,
      ts: new Date().toISOString()
    }))
    const { instance, listService, now, begin } = setup({ chartTotal: 71, rows })

    await instance.load()

    // Exactly one list request — no window-by-window walk.
    expect(listService).toHaveBeenCalledTimes(1)
    const call = listService.mock.calls[0][0]
    // Covers the full range begin, with the end clamped to ~now (not the future).
    expect(new Date(call.tsRange.tsRangeBegin).getTime()).toBe(begin)
    expect(new Date(call.tsRange.tsRangeEnd).getTime()).toBeLessThanOrEqual(now + 1000)
    expect(instance.tableData.value.length).toBe(71)
    expect(instance.hasMoreData.value).toBe(false)
    // Bug 15.6: the chart's accurate, non-partial total drives the DISPLAYED
    // count so the "Documents found" badge shows a real number on the default
    // (no active filters) view — not the "—" placeholder it regressed to after
    // the @total-computed → setRecordsFound bridge was removed.
    expect(instance.recordsFound.value).toBe('71')
  })

  it('positive chart total drives the displayed count on the no-filter default view (Bug 15.6)', async () => {
    // One row: an EMPTY list now zeroes the badge by design; Bug 15.6 is about
    // the chart total seeding the count when the default view HAS data.
    const { instance } = setup({
      chartTotal: 12345,
      pageSize: 100,
      rows: [{ id: 'row-1', ts: 1, tsFormat: 't1', summary: [] }]
    })

    await instance.load()

    // Formatted at the display edge, exactly like the active-filter count path.
    expect(instance.recordsFound.value).toBe(new Intl.NumberFormat('en-US').format(12345))
    expect(instance.recordsFound.value).toBe('12,345')
    // Never the not-yet-counted placeholder once a real total is known.
    expect(instance.recordsFound.value).not.toBe('—')
  })

  it('aggregate-vs-raw divergence: positive chart total + EMPTY list lights the indicator flag', async () => {
    const { instance } = setup({ chartTotal: 9700, rows: [] })

    await instance.load()

    expect(instance.tableData.value).toEqual([])
    expect(instance.recordsFound.value).toBe('0')
    expect(instance.aggregateDivergence.value).toBe(true)
  })

  it('zero total → no list request at all', async () => {
    const { instance, listService } = setup({ chartTotal: 0 })

    await instance.load()

    expect(listService).not.toHaveBeenCalled()
    expect(instance.tableData.value.length).toBe(0)
    expect(instance.recordsFound.value).toBe('0')
    expect(instance.hasMoreData.value).toBe(false)
  })
})
