import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'

// Testing outside a component — stub the keep-alive lifecycle hooks
// (useFieldStats releases/rehydrates via useKeepAliveResource, task 9.9).
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn(),
    onActivated: vi.fn(),
    onBeforeUnmount: vi.fn(),
    onDeactivated: vi.fn()
  }
})

import { useFieldStats, TOP_K } from '../useFieldStats'

const makeRow = (summaryEntries) => ({
  summary: Object.entries(summaryEntries).map(([key, value]) => ({ key, value }))
})

const defaultFields = [
  { label: 'host', value: 'host' },
  { label: 'status', value: 'status' },
  { label: 'method', value: 'method' }
]

const setup = (rows = []) => {
  const data = ref(rows)
  const availableFields = ref(defaultFields)
  const searchQuery = ref('')
  const selectedFields = ref([])

  const result = useFieldStats({ data, availableFields, searchQuery, selectedFields })
  return { data, availableFields, searchQuery, selectedFields, ...result }
}

describe('useFieldStats', () => {
  describe('fieldStats — incremental counting', () => {
    it('returns empty object when data is empty', () => {
      const { fieldStats } = setup([])
      expect(fieldStats.value).toEqual({})
    })

    it('counts field values from row summaries', async () => {
      const { fieldStats } = setup([
        makeRow({ status: '200', host: 'a.com' }),
        makeRow({ status: '200', host: 'b.com' }),
        makeRow({ status: '404', host: 'a.com' })
      ])
      await nextTick()

      expect(fieldStats.value.status.total).toBe(3)
      expect(fieldStats.value.status.uniqueCount).toBe(2)
      expect(fieldStats.value.host.total).toBe(3)
      expect(fieldStats.value.host.uniqueCount).toBe(2)
    })

    it('produces correct topValues with percentages', async () => {
      const { fieldStats } = setup([
        makeRow({ status: '200' }),
        makeRow({ status: '200' }),
        makeRow({ status: '200' }),
        makeRow({ status: '404' })
      ])
      await nextTick()

      const stats = fieldStats.value.status
      expect(stats.topValues[0].value).toBe('200')
      expect(stats.topValues[0].count).toBe(3)
      expect(stats.topValues[0].percent).toBe(75)
      expect(stats.topValues[1].value).toBe('404')
      expect(stats.topValues[1].count).toBe(1)
      expect(stats.topValues[1].percent).toBe(25)
    })

    it('incrementally processes new rows on append', async () => {
      const { data, fieldStats } = setup([makeRow({ status: '200' })])
      await nextTick()

      expect(fieldStats.value.status.total).toBe(1)

      // Simulate loadMore — append new rows
      data.value = [...data.value, makeRow({ status: '404' }), makeRow({ status: '200' })]
      await nextTick()

      expect(fieldStats.value.status.total).toBe(3)
      expect(fieldStats.value.status.uniqueCount).toBe(2)
    })

    it('fully rebuilds when data shrinks (new query)', async () => {
      const { data, fieldStats } = setup([
        makeRow({ status: '200' }),
        makeRow({ status: '200' }),
        makeRow({ status: '404' })
      ])
      await nextTick()

      expect(fieldStats.value.status.total).toBe(3)

      // Simulate new query — data shrinks
      data.value = [makeRow({ status: '500' })]
      await nextTick()

      expect(fieldStats.value.status.total).toBe(1)
      expect(fieldStats.value.status.uniqueCount).toBe(1)
      expect(fieldStats.value.status.topValues[0].value).toBe('500')
    })

    it('ignores dash values', async () => {
      const { fieldStats } = setup([makeRow({ status: '-', host: 'a.com' })])
      await nextTick()

      expect(fieldStats.value.host.total).toBe(1)
      // The status key exists but has no counted values
      expect(fieldStats.value.status.total).toBe(0)
      expect(fieldStats.value.status.uniqueCount).toBe(0)
    })

    it('skips rows without summary array', async () => {
      const data = ref([{ id: '1' }, makeRow({ status: '200' })])
      setup()
      // Replace data in the setup
      const result = useFieldStats({
        data,
        availableFields: ref(defaultFields),
        searchQuery: ref(''),
        selectedFields: ref([])
      })
      await nextTick()

      expect(result.fieldStats.value.status.total).toBe(1)
    })

    // FLIPPED (task 9.2): the cap moved from a magic 5 to the named TOP_K=50
    // constant, with an `other` bucket carrying the tail so `total` stays exact.
    // Below K, every distinct value is returned (no truncation).
    it('returns every distinct value when uniqueCount <= TOP_K', async () => {
      const rows = []
      // eslint-disable-next-line id-length
      for (let i = 0; i < 10; i++) {
        rows.push(makeRow({ code: `val_${i}` }))
      }
      const { fieldStats } = setup(rows)
      await nextTick()

      expect(fieldStats.value.code.topValues).toHaveLength(10)
      expect(fieldStats.value.code.uniqueCount).toBe(10)
      expect(fieldStats.value.code.total).toBe(10)
      expect(fieldStats.value.code.other).toBe(0)
    })

    it('caps topValues at TOP_K and carries the tail in `other` (total stays exact)', async () => {
      const rows = []
      const distinct = TOP_K + 25
      // eslint-disable-next-line id-length
      for (let i = 0; i < distinct; i++) {
        // give lower-index values higher counts so the top-K is deterministic
        const repeat = distinct - i
        // eslint-disable-next-line id-length
        for (let r = 0; r < repeat; r++) rows.push(makeRow({ code: `val_${i}` }))
      }
      const { fieldStats } = setup(rows)
      await nextTick()

      const stats = fieldStats.value.code
      expect(stats.topValues).toHaveLength(TOP_K)
      expect(stats.uniqueCount).toBe(distinct)

      const topSum = stats.topValues.reduce((sum, entry) => sum + entry.count, 0)
      // P5 invariant: total === Σ topValues.count + other (exact).
      expect(stats.total).toBe(topSum + stats.other)
      expect(stats.other).toBeGreaterThan(0)
    })

    it('resets to empty when data is cleared', async () => {
      const { data, fieldStats } = setup([makeRow({ status: '200' })])
      await nextTick()

      expect(fieldStats.value.status).toBeDefined()

      data.value = []
      await nextTick()

      expect(fieldStats.value).toEqual({})
    })
  })

  describe('fieldStats — resetToken', () => {
    it('rebuilds stats on token bump for a same-length dataset replacement', async () => {
      const data = ref([makeRow({ status: '200' }), makeRow({ status: '200' })])
      const resetToken = ref(0)
      const { fieldStats } = useFieldStats({
        data,
        availableFields: ref(defaultFields),
        searchQuery: ref(''),
        selectedFields: ref([]),
        resetToken
      })
      await nextTick()
      expect(fieldStats.value.status.topValues[0].value).toBe('200')

      // Same-length replacement: the length-watch does not fire, so the shrink
      // heuristic misses it and stats stay stale until the token bumps.
      data.value = [makeRow({ status: '500' }), makeRow({ status: '500' })]
      await nextTick()
      expect(fieldStats.value.status.topValues[0].value).toBe('200')

      resetToken.value += 1
      await nextTick()
      expect(fieldStats.value.status.topValues[0].value).toBe('500')
      expect(fieldStats.value.status.total).toBe(2)
    })
  })
})
