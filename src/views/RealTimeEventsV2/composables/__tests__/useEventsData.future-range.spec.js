import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useEventsData } from '../useEventsData.js'

vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: { request: vi.fn(async () => ({ statusCode: 200, body: { data: {} } })) }
}))

vi.mock('@/stores/graphql-query', () => ({
  useGraphQLStore: () => ({ setQuery: vi.fn() })
}))

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

/**
 * Regression: calendar presets such as "this week" / "today" end at the end of
 * the current day — i.e. in the future. The list is fetched newest→oldest in
 * MAX_LIST_RANGE_MS windows and stops at the first empty window, so a future
 * range end must NOT make the loader probe a future (empty) window first and
 * abort before reaching the real, past data. The starting window edge is
 * clamped to "now", mirroring how a "last N days" relative range behaves.
 */
describe('useEventsData — future range end clamps to now', () => {
  it('returns past data for a range whose end is in the future ("this week")', async () => {
    const now = Date.now()
    // 3 days back → 3 days forward, like "this week" viewed mid-week.
    const begin = now - 3 * 24 * 60 * 60 * 1000
    const end = now + 3 * 24 * 60 * 60 * 1000

    const calls = []
    const listService = vi.fn(async (params) => {
      const wBegin = new Date(params.tsRange.tsRangeBegin).getTime()
      const wEnd = new Date(params.tsRange.tsRangeEnd).getTime()
      calls.push({ wBegin, wEnd })
      // Windows that start in the future have no data; past windows return one row.
      if (wBegin >= now) return { data: [] }
      return { data: [{ id: `r-${wEnd}`, ts: new Date(wEnd).toISOString() }] }
    })

    const { load, tableData } = useEventsData({
      filterData: ref({
        tsRange: {
          tsRangeBegin: new Date(begin).toISOString(),
          tsRangeEnd: new Date(end).toISOString()
        },
        fields: []
      }),
      listService: ref(listService),
      loadChartAggregation: ref(null),
      tabSelected: ref({ dataset: 'test' }),
      pageSize: ref(5),
      hasChartConfig: ref(false),
      onError: vi.fn(),
      locale: 'en-US'
    })

    await load()

    // It must have found the past data rather than bailing on a future window.
    expect(tableData.value.length).toBeGreaterThan(0)

    // No window should start in the future — the first window edge is clamped to now.
    for (const call of calls) {
      expect(call.wBegin).toBeLessThan(now + 1000)
      // Tolerate the ~50ms debounce + execution drift between generating `now`
      // and load() reading Date.now(); the first window end must be ≈ now, not
      // the future range end.
      expect(call.wEnd).toBeLessThanOrEqual(now + TWO_HOURS_MS)
    }
  })
})
