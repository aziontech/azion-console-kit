/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'

/**
 * Feature: real-time-events-v2-refactor — Property P9 (task 9.1 / task 9.10).
 *
 * Validates: Requirements 4.2, 4.16.
 *
 * The document search index is LAZY and ID-KEYED:
 *  - It holds ZERO entries whenever the search is inactive (no query), released
 *    (query cleared), invalidated (resetToken bump while inactive), or the tab
 *    is deactivated under keep-alive. The heavy one-lowercase-string-per-row
 *    payload is never retained while idle (measured by entry count, not
 *    inferred from behavior — `indexSize()` reads the private Map size).
 *  - Because entries are keyed by `row.id` (not by slot), the filter and the
 *    highlight stay CORRECT after a reorder and after FIFO eviction of the
 *    oldest rows — the prerequisite for turning eviction on (task 9.2).
 *
 * The keep-alive lifecycle hooks are captured (not stubbed to no-ops) so the
 * deactivate → activate cycle can be driven deterministically outside a
 * component, exercising the real release/rehydrate path from useKeepAliveResource.
 */

// Capture the lifecycle callbacks so the test can fire the keep-alive
// acquire/release manually (there is no mounted component to fire them).
const hooks = { mounted: [], activated: [], beforeUnmount: [], deactivated: [] }

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn((cb) => hooks.mounted.push(cb)),
    onActivated: vi.fn((cb) => hooks.activated.push(cb)),
    onBeforeUnmount: vi.fn((cb) => hooks.beforeUnmount.push(cb)),
    onDeactivated: vi.fn((cb) => hooks.deactivated.push(cb))
  }
})

import { useDocumentSearch } from '../useDocumentSearch'

const makeRow = (id, fields = {}) => ({ id, ...fields })

const fire = (list) => list.forEach((cb) => cb())

/** Drives the debounced query to `term` and settles the derived computeds. */
const applyQuery = async (search, term) => {
  search.query.value = term
  await nextTick()
  vi.advanceTimersByTime(400)
  await nextTick()
  await nextTick()
}

beforeEach(() => {
  hooks.mounted = []
  hooks.activated = []
  hooks.beforeUnmount = []
  hooks.deactivated = []
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Feature: real-time-events-v2-refactor, P9: search index lazy + released + id-keyed', () => {
  it('holds ZERO entries while the search is inactive (idle path never materializes the index)', async () => {
    const rows = ref([makeRow('a', { name: 'Alice' }), makeRow('b', { name: 'Bob' })])
    const search = useDocumentSearch(rows)
    await nextTick()

    // No query → index is empty, and filteredData passes rows through untouched.
    expect(search.indexSize()).toBe(0)
    expect(search.filteredData.value).toHaveLength(2)

    // An append while idle must NOT build the index (lazy: cost-free idle path).
    rows.value = [...rows.value, makeRow('c', { name: 'Carol' })]
    await nextTick()
    expect(search.indexSize()).toBe(0)
  })

  it('builds the index only while a query is active, then RELEASES it to 0 when cleared', async () => {
    const rows = ref([makeRow('a', { name: 'Alice' }), makeRow('b', { name: 'Bob' })])
    const search = useDocumentSearch(rows)
    await nextTick()
    expect(search.indexSize()).toBe(0)

    await applyQuery(search, 'ali')
    // Active search → one entry per row.
    expect(search.indexSize()).toBe(2)
    expect(search.filteredData.value.map((row) => row.id)).toEqual(['a'])

    // Clearing the query releases the index back to 0 (P9).
    await applyQuery(search, '')
    expect(search.indexSize()).toBe(0)
    expect(search.filteredData.value).toHaveLength(2)
  })

  it('releases the index to 0 on deactivate and rebuilds on activate WHEN the query survives', async () => {
    const rows = ref([makeRow('a', { name: 'Alice' }), makeRow('b', { name: 'Bob' })])
    const search = useDocumentSearch(rows)
    fire(hooks.mounted) // acquire once on mount
    await applyQuery(search, 'bob')
    expect(search.indexSize()).toBe(2)

    // Keep-alive deactivate → the heavy index is dropped to 0 …
    fire(hooks.deactivated)
    expect(search.indexSize()).toBe(0)

    // … and re-activation rebuilds it because the query is still active.
    fire(hooks.activated)
    expect(search.indexSize()).toBe(2)
    expect(search.filteredData.value.map((row) => row.id)).toEqual(['b'])
  })

  it('stays at 0 across a deactivate/activate cycle when the search is inactive', async () => {
    const rows = ref([makeRow('a', { name: 'Alice' })])
    const search = useDocumentSearch(rows)
    fire(hooks.mounted)
    await nextTick()
    expect(search.indexSize()).toBe(0)

    fire(hooks.deactivated)
    expect(search.indexSize()).toBe(0)
    fire(hooks.activated)
    // Idle tab reactivated → index must remain released (never rebuilt for no query).
    expect(search.indexSize()).toBe(0)
  })

  it('invalidates on resetToken bump: rebuilds if still searching, releases if not', async () => {
    const rows = ref([makeRow('a', { name: 'Alice' }), makeRow('b', { name: 'Bob' })])
    const resetToken = ref(0)
    const search = useDocumentSearch(rows, resetToken)
    await applyQuery(search, 'alice')
    expect(search.indexSize()).toBe(2)

    // New query/dataset arrives (producer swaps rows + bumps resetToken).
    rows.value = [makeRow('x', { name: 'Alice Xu' })]
    resetToken.value += 1
    await nextTick()
    // Still searching → index rebuilt for the fresh set (id 'x' present).
    expect(search.indexSize()).toBe(1)
    expect(search.filteredData.value.map((row) => row.id)).toEqual(['x'])

    // Clear the query, then bump again while inactive → stays released.
    await applyQuery(search, '')
    expect(search.indexSize()).toBe(0)
    resetToken.value += 1
    await nextTick()
    expect(search.indexSize()).toBe(0)
  })
})

describe('Feature: real-time-events-v2-refactor, P9: id-keyed index survives reorder + FIFO eviction', () => {
  it('keeps the filter correct after the buffer REORDERS (index follows identity, not slot)', async () => {
    const rowA = makeRow('a', { name: 'Alpha' })
    const rowB = makeRow('b', { name: 'Bravo' })
    const rowC = makeRow('c', { name: 'Charlie' })
    const rows = ref([rowA, rowB, rowC])
    const search = useDocumentSearch(rows)
    await applyQuery(search, 'bravo')
    expect(search.filteredData.value.map((row) => row.id)).toEqual(['b'])

    // Reorder: "b" jumps to the front. A positional index would now match "a".
    rows.value = [rowB, rowC, rowA]
    await nextTick()
    expect(search.indexSize()).toBe(3)
    expect(search.filteredData.value.map((row) => row.id)).toEqual(['b'])
  })

  it('keeps filter + highlight correct after FIFO eviction of the oldest rows', async () => {
    const rows = ref([
      makeRow('r0', { name: 'zzz-old' }),
      makeRow('r1', { name: 'keep-me' }),
      makeRow('r2', { name: 'zzz-old' }),
      makeRow('r3', { name: 'keep-me' })
    ])
    const search = useDocumentSearch(rows)
    await applyQuery(search, 'keep')
    expect(search.filteredData.value.map((row) => row.id)).toEqual(['r1', 'r3'])
    expect(search.indexSize()).toBe(4)

    // FIFO eviction: drop the two oldest rows (front). The id-keyed index must
    // re-sync to the survivors and never mis-key the shifted positions.
    rows.value = [rows.value[2], rows.value[3]]
    await nextTick()

    expect(search.indexSize()).toBe(2)
    expect(search.filteredData.value.map((row) => row.id)).toEqual(['r3'])
    // Highlight of the surviving matched row is correct (wraps the term once).
    expect(search.highlight('keep-me')).toBe('<mark class="search-highlight">keep</mark>-me')
  })

  it('does not retain evicted rows in the index (entry count tracks the live set)', async () => {
    const rows = ref([
      makeRow('r0', { name: 'match' }),
      makeRow('r1', { name: 'match' }),
      makeRow('r2', { name: 'match' })
    ])
    const search = useDocumentSearch(rows)
    await applyQuery(search, 'match')
    expect(search.indexSize()).toBe(3)

    // Evict oldest two → index must shrink to exactly the survivor count.
    rows.value = [rows.value[2]]
    await nextTick()
    expect(search.indexSize()).toBe(1)
    expect(search.filteredData.value.map((row) => row.id)).toEqual(['r2'])
  })
})
