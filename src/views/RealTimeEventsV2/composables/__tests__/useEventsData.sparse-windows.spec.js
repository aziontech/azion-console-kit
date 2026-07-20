import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useEventsData } from '../useEventsData.js'

// loadTotalCount issues a single aggregate count query through this adapter.
// We return a fixed total so the windowed list walk knows how many records
// exist in the range and can stop once it has collected them all.
vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: {
    request: vi.fn(async () => ({
      statusCode: 200,
      body: { data: { test: [{ count: 3 }] } }
    }))
  }
}))

vi.mock('@/stores/graphql-query', () => ({
  useGraphQLStore: () => ({ setQuery: vi.fn() })
}))

/**
 * Regression: real-time-events list returns empty for a specific filter
 * (e.g. one domain over "this week") even though the chart/KPI count shows
 * data exists.
 *
 * Root cause: the list is fetched newest→oldest in 2h windows and used to
 * abort on the FIRST empty window, assuming older windows are empty too.
 * That holds for dense datasets but is false for sparse/filtered data, which
 * commonly has empty windows sitting between populated ones. The walk must
 * instead keep going until it has collected every record known to exist
 * (knownTotalCount from loadTotalCount) or reached the range begin.
 */
describe('useEventsData — sparse data with empty leading windows', () => {
  it('does not stop at the first empty window; finds data further back', async () => {
    const now = Date.now()
    // "This week" viewed mid-week: 3 days back → 3 days forward.
    const begin = now - 3 * 24 * 60 * 60 * 1000
    const end = now + 3 * 24 * 60 * 60 * 1000

    // All 3 events live ~7h ago — past the first few empty 2h windows.
    const dataTs = now - 7 * 60 * 60 * 1000
    const rows = [
      { id: 'a', ts: new Date(dataTs).toISOString() },
      { id: 'b', ts: new Date(dataTs - 60_000).toISOString() },
      { id: 'c', ts: new Date(dataTs - 120_000).toISOString() }
    ]

    const calls = []
    const listService = vi.fn(async (params) => {
      const wBegin = new Date(params.tsRange.tsRangeBegin).getTime()
      const wEnd = new Date(params.tsRange.tsRangeEnd).getTime()
      calls.push({ wBegin, wEnd })
      // Only the window covering dataTs has rows; every other window is empty.
      if (wBegin <= dataTs && dataTs < wEnd) return { data: rows }
      return { data: [] }
    })

    const { load, tableData } = useEventsData({
      filterData: ref({
        tsRange: {
          tsRangeBegin: new Date(begin).toISOString(),
          tsRangeEnd: new Date(end).toISOString()
        },
        // An active filter makes loadTotalCount run, supplying knownTotalCount.
        fields: [{ valueField: 'host', operator: 'Eq', value: 'example.com', type: 'string' }]
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

    // The walk must have probed more than one window (it did not bail on the
    // first empty one) and surfaced the data that lives further back.
    expect(calls.length).toBeGreaterThan(1)
    expect(tableData.value.map((row) => row.id)).toEqual(['a', 'b', 'c'])
  })
})
