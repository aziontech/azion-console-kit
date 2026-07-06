import { describe, it, expect } from 'vitest'
import { shallowRef, ref, nextTick, effectScope, triggerRef } from 'vue'
import { useEventDataset } from '../useEventDataset'
import { useFieldStats } from '../useFieldStats'

const makeRow = (id) => ({
  id,
  summary: [
    { key: 'host', value: `host-${id % 7}.example.com` },
    { key: 'status', value: String(200 + (id % 5)) }
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

describe('H3 — field-stats derived maps bounded under production loadMore (onEvict NOT wired)', () => {
  it('per-field total never exceeds maxRows even after appending 20000 rows in-place', async () => {
    const rows = shallowRef([])
    const { result: dataset } = inScope(() =>
      useEventDataset({ rows, pageSize: 100, evictionEnabled: true })
    )
    const availableFields = ref([{ value: 'host' }, { value: 'status' }])
    const { result: stats } = inScope(() =>
      useFieldStats({
        data: dataset.rows,
        availableFields,
        searchQuery: ref(''),
        selectedFields: ref([])
      })
    )

    rows.value = Array.from({ length: 100 }, (_unused, idx) => makeRow(idx))
    await nextTick()

    let nextId = 100
    for (let page = 0; page < 200; page++) {
      for (let step = 0; step < 100; step++) rows.value.push(makeRow(nextId++))
      triggerRef(rows)
      await nextTick()
    }

    const fs = stats.fieldStats.value
    const maxTotal = Math.max(...Object.values(fs).map((stat) => stat.total))
    // If ingested/rowContributions grew O(all-fetched)=20100 the total would too.
    expect(dataset.rows.value.length).toBe(dataset.maxRows)
    expect(maxTotal).toBeLessThanOrEqual(dataset.maxRows)
  })
})
