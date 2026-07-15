import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useEventsData } from '../useEventsData.js'

const DAY_MS = 864e5
const WINDOW_MS = 2 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

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

describe('windowed walk — geometric ladder bounds every scan', () => {
  it('empty 8-day range: bounded ladder 2h→8h→32h→128h→22h, count 0, no hasMore', async () => {
    const listService = vi.fn(async () => ({ data: [] }))
    const { instance, begin } = createLongRangeInstance(listService)

    await instance.load()

    // Every probe is a BOUNDED window growing ×4 — never one query that makes
    // the engine scan the whole remaining range (the processed-bytes whale).
    const spansHours = listService.mock.calls.map(([params]) => {
      const spanMs =
        new Date(params.tsRange.tsRangeEnd).getTime() -
        new Date(params.tsRange.tsRangeBegin).getTime()
      return spanMs / HOUR_MS
    })
    expect(spansHours).toEqual([2, 8, 32, 128, 22])
    // Contiguous newest→oldest: each probe ends exactly where the previous began.
    for (let idx = 1; idx < listService.mock.calls.length; idx++) {
      expect(listService.mock.calls[idx][0].tsRange.tsRangeEnd).toBe(
        listService.mock.calls[idx - 1][0].tsRange.tsRangeBegin
      )
    }
    expect(listService.mock.calls.at(-1)[0].tsRange.tsRangeBegin).toBe(begin)
    expect(instance.tableData.value).toEqual([])
    expect(instance.recordsFound.value).toBe('0')
    expect(instance.hasMoreData.value).toBe(false)
    // No aggregate signal in this harness → no divergence indicator.
    expect(instance.aggregateDivergence.value).toBe(false)
  })

  it('sparse range: the grown (8h) window finds the old rows in 2 bounded requests', async () => {
    const now = Date.now()
    const oldRows = buildRows(10, now - 5 * HOUR_MS)
    const listService = vi.fn(async (params) => {
      const span =
        new Date(params.tsRange.tsRangeEnd).getTime() -
        new Date(params.tsRange.tsRangeBegin).getTime()
      // 2h window (newest slice) → empty; the ×4-grown window → old rows.
      return span <= WINDOW_MS ? { data: [] } : { data: oldRows }
    })
    const { instance } = createLongRangeInstance(listService)

    await instance.load()

    expect(listService).toHaveBeenCalledTimes(2)
    // The second probe is the ×4-grown window — NOT the whole remaining range.
    const second = listService.mock.calls[1][0]
    const secondSpan =
      new Date(second.tsRange.tsRangeEnd).getTime() -
      new Date(second.tsRange.tsRangeBegin).getTime()
    expect(secondSpan).toBe(4 * WINDOW_MS)
    expect(instance.tableData.value).toHaveLength(10)
    expect(instance.tableData.value[0].id).toBe('row-0')
  })
})
