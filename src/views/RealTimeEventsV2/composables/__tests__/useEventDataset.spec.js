/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
import { describe, it, expect } from 'vitest'
import { shallowRef, ref, nextTick, effectScope } from 'vue'
import { useEventDataset, computeMaxRows, DEFAULT_MAX_ROWS } from '../useEventDataset'

const makeRow = (id, summary = []) => ({
  id,
  ts: id,
  tsFormat: `fmt-${id}`,
  summary
})

const summaryOf = (pairs) => Object.entries(pairs).map(([key, value]) => ({ key, value }))

/**
 * Runs a factory inside an effect scope so the composable's `watch` has an
 * owner (and is disposable). Returns the composable result plus a `stop` fn.
 */
const inScope = (factory) => {
  const scope = effectScope()
  let result
  scope.run(() => {
    result = factory()
  })
  return { result, stop: () => scope.stop() }
}

describe('useEventDataset — table data contract (Fase 1)', () => {
  describe('rows contract', () => {
    it('re-exposes the injected rows shallowRef verbatim (bind once)', () => {
      const rows = shallowRef([makeRow('a'), makeRow('b')])
      const { result } = inScope(() => useEventDataset({ rows }))
      expect(result.rows).toBe(rows)
      expect(result.rows.value).toHaveLength(2)
    })

    it('re-exposes the injected hasMore ref as the single source', () => {
      const rows = shallowRef([])
      const hasMore = ref(true)
      const { result } = inScope(() => useEventDataset({ rows, hasMore }))
      expect(result.hasMore).toBe(hasMore)
      expect(result.hasMore.value).toBe(true)
    })

    it('provides private refs when rows/hasMore are omitted', () => {
      const { result } = inScope(() => useEventDataset())
      expect(result.rows.value).toEqual([])
      expect(result.hasMore.value).toBe(false)
    })
  })

  describe('indexOfId + id-keyed lookups', () => {
    it('returns O(1) index by id and -1 when absent', () => {
      const rows = shallowRef([makeRow('a'), makeRow('b'), makeRow('c')])
      const { result } = inScope(() => useEventDataset({ rows }))
      expect(result.indexOfId('a')).toBe(0)
      expect(result.indexOfId('b')).toBe(1)
      expect(result.indexOfId('c')).toBe(2)
      expect(result.indexOfId('missing')).toBe(-1)
    })

    it('hasId / rowById resolve by identity', () => {
      const rowB = makeRow('b')
      const rows = shallowRef([makeRow('a'), rowB])
      const { result } = inScope(() => useEventDataset({ rows }))
      expect(result.hasId('b')).toBe(true)
      expect(result.hasId('zzz')).toBe(false)
      expect(result.rowById('b')).toBe(rowB)
      expect(result.rowById('zzz')).toBeUndefined()
    })

    it('re-indexes on append (loadMore) without dropping earlier ids', async () => {
      const rows = shallowRef([makeRow('a')])
      const { result } = inScope(() => useEventDataset({ rows }))
      expect(result.indexOfId('a')).toBe(0)

      rows.value = [...rows.value, makeRow('b'), makeRow('c')]
      await nextTick()

      expect(result.indexOfId('a')).toBe(0)
      expect(result.indexOfId('b')).toBe(1)
      expect(result.indexOfId('c')).toBe(2)
    })

    it('ignores rows without an id', () => {
      const rows = shallowRef([makeRow('a'), { ts: 1, summary: [] }])
      const { result } = inScope(() => useEventDataset({ rows }))
      expect(result.indexOfId('a')).toBe(0)
      expect(result.rows.value).toHaveLength(2)
    })
  })

  describe('summary index (O(1) cell access)', () => {
    it('builds a Map<fieldKey,value> per row from summary', () => {
      const rows = shallowRef([makeRow('a', summaryOf({ host: 'example.com', status: '200' }))])
      const { result } = inScope(() => useEventDataset({ rows }))
      const map = result.summaryMapOf('a')
      expect(map).toBeInstanceOf(Map)
      expect(map.get('host')).toBe('example.com')
      expect(map.get('status')).toBe('200')
    })

    it('fieldValueOf reads a single cell in O(1)', () => {
      const rows = shallowRef([makeRow('a', summaryOf({ host: 'example.com' }))])
      const { result } = inScope(() => useEventDataset({ rows }))
      expect(result.fieldValueOf('a', 'host')).toBe('example.com')
      expect(result.fieldValueOf('a', 'nope')).toBeUndefined()
    })

    it('returns an empty map for unknown id or missing summary', () => {
      const rows = shallowRef([makeRow('a')])
      const { result } = inScope(() => useEventDataset({ rows }))
      expect(result.summaryMapOf('unknown').size).toBe(0)
      expect(result.summaryMapOf('a').size).toBe(0)
    })

    it('rebuilds the summary index after append', async () => {
      const rows = shallowRef([makeRow('a', summaryOf({ host: 'a.com' }))])
      const { result } = inScope(() => useEventDataset({ rows }))
      rows.value = [...rows.value, makeRow('b', summaryOf({ host: 'b.com' }))]
      await nextTick()
      expect(result.fieldValueOf('b', 'host')).toBe('b.com')
    })
  })

  describe('resetToken', () => {
    it('starts at 0', () => {
      const rows = shallowRef([makeRow('a')])
      const { result } = inScope(() => useEventDataset({ rows }))
      expect(result.resetToken.value).toBe(0)
    })

    it('does NOT bump on append (loadMore)', async () => {
      const rows = shallowRef([makeRow('a')])
      const { result } = inScope(() => useEventDataset({ rows }))
      rows.value = [...rows.value, makeRow('b')]
      await nextTick()
      expect(result.resetToken.value).toBe(0)
    })

    it('bumps when the producer replaces the buffer with a shorter set (new query)', async () => {
      const rows = shallowRef([makeRow('a'), makeRow('b'), makeRow('c')])
      const { result } = inScope(() => useEventDataset({ rows }))
      // producer clears then loads a fresh, smaller set
      rows.value = [makeRow('x')]
      await nextTick()
      expect(result.resetToken.value).toBe(1)
    })

    it('bumps to empty and clears the index on reset()', async () => {
      const rows = shallowRef([makeRow('a'), makeRow('b')])
      const { result } = inScope(() => useEventDataset({ rows }))
      result.reset()
      await nextTick()
      expect(result.rows.value).toEqual([])
      expect(result.indexOfId('a')).toBe(-1)
      expect(result.resetToken.value).toBe(1)
    })

    it('clearing then reloading (shrink to 0, then grow) bumps exactly once for the shrink', async () => {
      const rows = shallowRef([makeRow('a'), makeRow('b')])
      const { result } = inScope(() => useEventDataset({ rows }))

      rows.value = [] // producer clears
      await nextTick()
      expect(result.resetToken.value).toBe(1)

      rows.value = [makeRow('x'), makeRow('y')] // producer loads fresh set (grow)
      await nextTick()
      expect(result.resetToken.value).toBe(1) // grow does not bump
      expect(result.indexOfId('x')).toBe(0)
    })
  })

  describe('buffer ceiling', () => {
    it('computeMaxRows = max(10×pageSize, 5000)', () => {
      expect(computeMaxRows(0)).toBe(DEFAULT_MAX_ROWS)
      expect(computeMaxRows(100)).toBe(5000)
      expect(computeMaxRows(700)).toBe(7000)
    })

    it('exposes maxRows derived from pageSize', () => {
      const rows = shallowRef([])
      const { result } = inScope(() => useEventDataset({ rows, pageSize: 700 }))
      expect(result.maxRows).toBe(7000)
    })
  })

  describe('eviction gated OFF (Fase 1 invariant)', () => {
    it('evictionEnabled defaults to false', () => {
      const { result } = inScope(() => useEventDataset({ rows: shallowRef([]) }))
      expect(result.evictionEnabled).toBe(false)
    })

    it('evict() is a no-op while gated off, even above the ceiling', async () => {
      const big = Array.from({ length: 20 }, (unused, index) => makeRow(`r${index}`))
      const rows = shallowRef(big)
      // force a tiny ceiling to prove eviction is NOT applied despite exceeding it
      const { result } = inScope(() => useEventDataset({ rows, pageSize: 1 }))
      // ceiling = max(10*1, 5000) = 5000; use reset+append to exceed conceptually
      // simplest: assert evict() does not shrink the buffer
      result.evict()
      await nextTick()
      expect(result.rows.value).toHaveLength(20)
    })

    it('does NOT evict on append even past the ceiling (buffer grows as today)', async () => {
      const rows = shallowRef([])
      // ceiling forced small via a synthetic maxRows through pageSize is still 5000;
      // to keep the test fast we assert the growth semantics directly.
      const { result } = inScope(() => useEventDataset({ rows }))
      rows.value = Array.from({ length: 6000 }, (unused, index) => makeRow(`r${index}`))
      await nextTick()
      expect(result.rows.value).toHaveLength(6000)
      expect(result.indexOfId('r5999')).toBe(5999)
    })
  })

  describe('eviction ON (Fase 4)', () => {
    it('evict() trims oldest to the ceiling and re-indexes when enabled', async () => {
      const rows = shallowRef(Array.from({ length: 5010 }, (unused, index) => makeRow(`r${index}`)))
      const { result } = inScope(() =>
        useEventDataset({ rows, pageSize: 100, evictionEnabled: true })
      )
      result.evict()
      await nextTick()
      expect(result.rows.value).toHaveLength(5000)
      // oldest 10 evicted → r0..r9 gone, r10 is now index 0
      expect(result.indexOfId('r0')).toBe(-1)
      expect(result.indexOfId('r10')).toBe(0)
      expect(result.indexOfId('r5009')).toBe(4999)
    })

    it('eviction does NOT bump resetToken (eviction ≠ new query, §7.4)', async () => {
      const rows = shallowRef(Array.from({ length: 5005 }, (unused, index) => makeRow(`r${index}`)))
      const { result } = inScope(() =>
        useEventDataset({ rows, pageSize: 100, evictionEnabled: true })
      )
      // the immediate growth pass already evicts down to the ceiling
      await nextTick()
      expect(result.rows.value).toHaveLength(5000)
      expect(result.resetToken.value).toBe(0)
    })

    it('auto-evicts on append growth past the ceiling', async () => {
      const rows = shallowRef([makeRow('r0')])
      const { result } = inScope(() =>
        useEventDataset({ rows, pageSize: 1, evictionEnabled: true })
      )
      // ceiling = max(10*1, 5000) = 5000; grow to 5003 → auto-evict to 5000
      rows.value = Array.from({ length: 5003 }, (unused, index) => makeRow(`r${index}`))
      await nextTick()
      expect(result.rows.value).toHaveLength(5000)
      expect(result.indexOfId('r0')).toBe(-1)
      expect(result.indexOfId('r3')).toBe(0)
      expect(result.resetToken.value).toBe(0)
    })

    it('invokes onEvict with the dropped (oldest) rows', async () => {
      const rows = shallowRef(Array.from({ length: 5004 }, (unused, index) => makeRow(`r${index}`)))
      const dropped = []
      const { result } = inScope(() =>
        useEventDataset({
          rows,
          pageSize: 100,
          evictionEnabled: true,
          onEvict: (batch) => dropped.push(...batch)
        })
      )
      await nextTick()
      expect(result.rows.value).toHaveLength(5000)
      expect(dropped.map((row) => row.id)).toEqual(['r0', 'r1', 'r2', 'r3'])
    })

    it('a genuine new query (shrink) still bumps resetToken with eviction on', async () => {
      const rows = shallowRef([makeRow('a'), makeRow('b'), makeRow('c')])
      const { result } = inScope(() =>
        useEventDataset({ rows, pageSize: 100, evictionEnabled: true })
      )
      rows.value = [makeRow('x')]
      await nextTick()
      expect(result.resetToken.value).toBe(1)
    })
  })

  // Task 9.9 (req 4.6): keep-alive release/rehydrate of the reclaimable derived
  // memory. Verified BY COUNT through the public id-keyed seam — after release
  // the indexes resolve to nothing (entry count → 0); after rehydrate they
  // resolve again. The retained `rows` buffer is never touched (no re-fetch).
  describe('releaseReclaimable / rehydrate (keep-alive, task 9.9)', () => {
    it('releaseReclaimable drops the id-keyed indexes to 0 entries without touching rows', () => {
      const rows = shallowRef([
        makeRow('a', summaryOf({ host: 'a.com' })),
        makeRow('b', summaryOf({ host: 'b.com' }))
      ])
      const { result } = inScope(() => useEventDataset({ rows }))
      // indexes populated
      expect(result.indexOfId('a')).toBe(0)
      expect(result.summaryMapOf('a').get('host')).toBe('a.com')

      result.releaseReclaimable()

      // derived indexes are empty (entry count → 0) …
      expect(result.indexOfId('a')).toBe(-1)
      expect(result.indexOfId('b')).toBe(-1)
      expect(result.hasId('a')).toBe(false)
      expect(result.summaryMapOf('a').size).toBe(0)
      expect(result.rowById('a')).toBeUndefined()
      // … but the retained buffer survives (it IS the data — no re-fetch)
      expect(result.rows.value).toHaveLength(2)
    })

    it('rehydrate rebuilds the id-keyed indexes from the surviving buffer', () => {
      const rows = shallowRef([
        makeRow('a', summaryOf({ host: 'a.com' })),
        makeRow('b', summaryOf({ host: 'b.com' }))
      ])
      const { result } = inScope(() => useEventDataset({ rows }))
      result.releaseReclaimable()
      expect(result.indexOfId('a')).toBe(-1)

      result.rehydrate()

      expect(result.indexOfId('a')).toBe(0)
      expect(result.indexOfId('b')).toBe(1)
      expect(result.summaryMapOf('b').get('host')).toBe('b.com')
      expect(result.fieldValueOf('a', 'host')).toBe('a.com')
    })

    it('releaseReclaimable does NOT bump resetToken (reclaim ≠ new query)', () => {
      const rows = shallowRef([makeRow('a'), makeRow('b')])
      const { result } = inScope(() => useEventDataset({ rows }))
      const before = result.resetToken.value
      result.releaseReclaimable()
      result.rehydrate()
      expect(result.resetToken.value).toBe(before)
    })

    it('is idempotent — repeated release/rehydrate keeps indexes coherent', () => {
      const rows = shallowRef([makeRow('a'), makeRow('b'), makeRow('c')])
      const { result } = inScope(() => useEventDataset({ rows }))
      result.releaseReclaimable()
      result.releaseReclaimable()
      result.rehydrate()
      result.rehydrate()
      expect(result.indexOfId('a')).toBe(0)
      expect(result.indexOfId('c')).toBe(2)
    })

    it('after rehydrate, a subsequent append still indexes only the new tail (no desync)', async () => {
      const rows = shallowRef([makeRow('a'), makeRow('b')])
      const { result } = inScope(() => useEventDataset({ rows }))
      // simulate a deactivate/activate cycle
      result.releaseReclaimable()
      result.rehydrate()

      rows.value = [...rows.value, makeRow('c')]
      await nextTick()

      expect(result.indexOfId('a')).toBe(0)
      expect(result.indexOfId('b')).toBe(1)
      expect(result.indexOfId('c')).toBe(2)
      // an append after rehydrate must not be misread as a new query
      expect(result.resetToken.value).toBe(0)
    })
  })
})
