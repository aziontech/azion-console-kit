import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useEventsData } from '../useEventsData.js'

const DAY_MS = 864e5
const WINDOW_MS = 2 * 60 * 60 * 1000

const buildRows = (count, baseTime) =>
  Array.from({ length: count }, (_unused, idx) => {
    const ts = new Date(baseTime - idx * 1000).toISOString()
    return { id: `row-${idx}`, ts, tsFormat: ts, summary: [{ key: 'host', value: `h-${idx}` }] }
  })

// 8-day range → windowed-walk path (range > MAX_LIST_RANGE_MS).
function createLongRangeInstance(listService) {
  const now = Date.now()
  const begin = new Date(now - 8 * DAY_MS).toISOString()
  const end = new Date(now).toISOString()
  const instance = useEventsData({
    filterData: ref({ tsRange: { tsRangeBegin: begin, tsRangeEnd: end }, fields: [] }),
    listService: ref(listService),
    loadChartAggregation: ref(null),
    tabSelected: ref({ dataset: 'test' }),
    pageSize: ref(10),
    hasChartConfig: ref(false),
    onError: vi.fn(),
    locale: 'en-US'
  })
  return { instance, begin }
}

describe('windowed walk — first empty window stops the storm', () => {
  it('empty range: exactly 2 requests (window + wide probe), count 0, no hasMore', async () => {
    const listService = vi.fn(async () => ({ data: [] }))
    const { instance, begin } = createLongRangeInstance(listService)

    await instance.load()

    expect(listService).toHaveBeenCalledTimes(2)
    // The wide probe covers the REMAINING range back to the full range begin.
    const wideCall = listService.mock.calls[1][0]
    expect(wideCall.tsRange.tsRangeBegin).toBe(begin)
    expect(instance.tableData.value).toEqual([])
    expect(instance.recordsFound.value).toBe('0')
    expect(instance.hasMoreData.value).toBe(false)
    // No aggregate signal in this harness → no divergence indicator.
    expect(instance.aggregateDivergence.value).toBe(false)
  })

  it('sparse range: empty recent window falls back to ONE wide probe that finds the old rows', async () => {
    const now = Date.now()
    const oldRows = buildRows(10, now - 5 * DAY_MS)
    const listService = vi.fn(async (params) => {
      const span =
        new Date(params.tsRange.tsRangeEnd).getTime() -
        new Date(params.tsRange.tsRangeBegin).getTime()
      // 2h window (newest slice) → empty; wide remainder → old rows.
      return span <= WINDOW_MS ? { data: [] } : { data: oldRows }
    })
    const { instance } = createLongRangeInstance(listService)

    await instance.load()

    expect(listService).toHaveBeenCalledTimes(2)
    expect(instance.tableData.value).toHaveLength(10)
    expect(instance.tableData.value[0].id).toBe('row-0')
  })
})
