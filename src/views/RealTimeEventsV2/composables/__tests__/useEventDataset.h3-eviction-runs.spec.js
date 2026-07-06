import { describe, it, expect } from 'vitest'
import { shallowRef, nextTick, effectScope, triggerRef } from 'vue'
import { useEventDataset } from '../useEventDataset'
import { useDocumentSearch } from '../useDocumentSearch'

const makeRow = (id) => ({
  id,
  ts: id,
  tsFormat: `fmt-${id}`,
  summary: [
    { key: 'host', value: `host-${id % 7}.example.com` },
    { key: 'status', value: String(200 + (id % 5)) },
    { key: 'requestUri', value: `/path/${id}` }
  ]
})

const inScope = (factory) => {
  const scope = effectScope()
  let result
  scope.run(() => {
    result = factory()
  })
  return { result, stop: () => scope.stop() }
}

describe('H3 — dataset eviction under the PRODUCTION loadMore mutation pattern', () => {
  // Production useEventsData.loadMore (useEventsData.js:524) does:
  //   tableData.value.push(...newRecords); triggerRef(tableData)
  // i.e. IN-PLACE mutation + triggerRef, NOT `rows.value = [...]` reassignment.
  // Every existing eviction spec uses reassignment. This test drives the real
  // in-place path to prove the dataset watch fires AND evict() actually trims.
  it('trims the buffer to maxRows when rows are appended in-place + triggerRef', async () => {
    const rows = shallowRef([])
    const { result, stop } = inScope(() =>
      useEventDataset({ rows, pageSize: 100, evictionEnabled: true })
    )
    const maxRows = result.maxRows // max(10*100, 5000) = 5000

    // initial load: producer assigns a fresh page (this path IS reassignment)
    rows.value = Array.from({ length: 100 }, (_unused, idx) => makeRow(idx))
    await nextTick()
    expect(result.rows.value).toHaveLength(100)

    // 200 loadMore pages of 100 rows each => 20000 appended IN PLACE.
    let nextId = 100
    for (let page = 0; page < 200; page++) {
      for (let step = 0; step < 100; step++) rows.value.push(makeRow(nextId++))
      triggerRef(rows) // exactly what production loadMore does
      await nextTick()
    }

    // If eviction runs under the in-place pattern, the buffer is bounded.
    // If the watch never fires (or evict never trims), length === 20100.
    expect(result.rows.value.length).toBeLessThanOrEqual(maxRows)
    expect(result.rows.value).toHaveLength(maxRows)

    // id-index is bounded and tracks the SURVIVING window (newest maxRows).
    const total = nextId // 20100
    expect(result.indexOfId(0)).toBe(-1) // oldest evicted
    expect(result.indexOfId(total - 1)).toBe(maxRows - 1) // newest retained
    // summaryIndex (one Map per row) is bounded to the same window.
    expect(result.summaryMapOf(total - 1).get('status')).toBe(String(200 + ((total - 1) % 5)))
    expect(result.summaryMapOf(0).size).toBe(0) // evicted row's Map is gone

    stop()
  })

  it('search index (one lowercase string per row) stays bounded to the live buffer', async () => {
    const rows = shallowRef([])
    const { result: dataset } = inScope(() =>
      useEventDataset({ rows, pageSize: 100, evictionEnabled: true })
    )
    const { result: search } = inScope(() => useDocumentSearch(dataset.rows, dataset.resetToken))

    rows.value = Array.from({ length: 100 }, (_unused, idx) => makeRow(idx))
    await nextTick()

    // activate a search so the lazy index materializes
    search.query.value = 'host'
    await new Promise((resolve) => setTimeout(resolve, 450)) // debounce
    await nextTick()
    const idxAfterInitial = search.indexSize()

    let nextId = 100
    for (let page = 0; page < 200; page++) {
      for (let step = 0; step < 100; step++) rows.value.push(makeRow(nextId++))
      triggerRef(rows)
      await nextTick()
    }

    // index must not be O(all-fetched) = 20100; bounded to the evicted buffer.
    expect(search.indexSize()).toBeLessThanOrEqual(dataset.maxRows)
    expect(idxAfterInitial).toBe(100)
  })
})
