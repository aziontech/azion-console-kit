import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
import { useRowWindow } from '../useRowWindow.js'

/**
 * Feature: real-time-events-v2-refactor — task 3.2 (`useRowWindow`).
 *
 * Validates: Requirements 1.1, 1.6, 1.7 (render O(viewport), variable-height
 * windowing, scroll anchoring/reset). The windower keeps a measured-height
 * cache keyed by `row.id`, derives cumulative offsets via prefix-sum, and
 * locates the visible range by binary search — so mounted rows stay bounded
 * regardless of dataset size.
 *
 * Each `it` mounts NO component: `useRowWindow` owns no DOM. The host feeds it
 * plain reactive `scrollTop`/`viewportHeight` numbers, which the tests drive
 * directly. TZ=UTC is irrelevant here (no timestamps) but the suite still runs
 * under it per repo convention.
 */

const makeRows = (count, prefix = 'r') =>
  Array.from({ length: count }, (unused, index) => ({ id: `${prefix}${index}`, index }))

/**
 * Convenience factory: builds a windower over `rows` with driveable
 * scrollTop/viewportHeight refs and a fixed estimate/overscan.
 */
function setup({
  rows = makeRows(1000),
  estimatedRowHeight = 40,
  overscan = 5,
  viewportHeight = 400,
  scrollTop = 0,
  expandedIds = new Set(),
  resetToken,
  onAnchorAdjust
} = {}) {
  const rowsRef = ref(rows)
  const scrollTopRef = ref(scrollTop)
  const viewportRef = ref(viewportHeight)
  const resetTokenRef = resetToken ?? ref(0)

  const api = useRowWindow({
    logicalRows: rowsRef,
    scrollTop: scrollTopRef,
    viewportHeight: viewportRef,
    estimatedRowHeight,
    overscan,
    keyOf: (row) => row.id,
    expandedKey: (row) => expandedIds.has(row.id),
    resetToken: resetTokenRef,
    onAnchorAdjust
  })

  return { api, rowsRef, scrollTopRef, viewportRef, resetTokenRef }
}

describe('useRowWindow — bounded window (req 1.1)', () => {
  it('mounts only visible rows plus overscan on both sides, not the whole dataset', () => {
    const { api } = setup({
      rows: makeRows(10000),
      estimatedRowHeight: 40,
      overscan: 5,
      viewportHeight: 400
    })

    // Viewport shows 400/40 = 10 rows; + overscan 5 above (clamped at top) + 5 below.
    // At scrollTop 0: start=0, end = lastVisible(=10)+1+5 = 16.
    expect(api.windowedRows.value.length).toBe(16)
    expect(api.windowedRows.value[0].index).toBe(0)
  })

  it('mounted-row count is CONSTANT for N=100 vs N=10000 (P2 windowing invariant)', () => {
    const small = setup({
      rows: makeRows(100),
      estimatedRowHeight: 40,
      overscan: 5,
      viewportHeight: 400
    })
    const large = setup({
      rows: makeRows(10000),
      estimatedRowHeight: 40,
      overscan: 5,
      viewportHeight: 400
    })

    // Scroll both into the middle so overscan applies on both edges identically.
    small.scrollTopRef.value = 800
    large.scrollTopRef.value = 800

    expect(large.api.windowedRows.value.length).toBe(small.api.windowedRows.value.length)
  })

  it('scrolling advances the window and keeps its size bounded', () => {
    const { api, scrollTopRef } = setup({
      rows: makeRows(10000),
      estimatedRowHeight: 40,
      overscan: 5,
      viewportHeight: 400
    })

    scrollTopRef.value = 4000 // row 100 at top
    const win = api.windowedRows.value
    expect(win[0].index).toBe(100 - 5) // 5 overscan above
    expect(win.length).toBeLessThanOrEqual(10 + 1 + 5 + 5)
  })

  it('empty dataset yields no windowed rows and zero spacers', () => {
    const { api } = setup({ rows: [] })
    expect(api.windowedRows.value).toEqual([])
    expect(api.topSpacer.value).toBe(0)
    expect(api.bottomSpacer.value).toBe(0)
    expect(api.totalHeight.value).toBe(0)
  })
})

describe('useRowWindow — spacers reflect off-window height (req 1.1)', () => {
  it('topSpacer + rendered heights + bottomSpacer === totalHeight', () => {
    const { api } = setup({
      rows: makeRows(500),
      estimatedRowHeight: 40,
      overscan: 5,
      viewportHeight: 400,
      scrollTop: 2000
    })

    const renderedHeight = api.windowedRows.value.reduce(
      (sum, { key }) => sum + api.getRowHeight(key),
      0
    )
    expect(api.topSpacer.value + renderedHeight + api.bottomSpacer.value).toBe(
      api.totalHeight.value
    )
  })

  it('totalHeight uses the estimate for unmeasured rows', () => {
    const { api } = setup({ rows: makeRows(10), estimatedRowHeight: 40 })
    expect(api.totalHeight.value).toBe(10 * 40)
  })
})

describe('useRowWindow — measured heights keyed by id, not index (req 1.6, §2.1(1))', () => {
  it('measureRow overrides the estimate for that row identity', () => {
    const { api } = setup({ rows: makeRows(10), estimatedRowHeight: 40 })
    api.measureRow('r3', 120)
    expect(api.getRowHeight('r3')).toBe(120)
    // total = 9 estimated (40) + 1 measured (120)
    expect(api.totalHeight.value).toBe(9 * 40 + 120)
  })

  it('a measured height follows its id when the row list reorders', () => {
    const { api, rowsRef } = setup({ rows: makeRows(5), estimatedRowHeight: 40 })
    api.measureRow('r2', 200)
    expect(api.getRowHeight('r2')).toBe(200)

    // Reverse the rows: same ids, different positions.
    rowsRef.value = [...rowsRef.value].reverse()
    // Height stays attached to id r2, wherever it now sits.
    expect(api.getRowHeight('r2')).toBe(200)
    expect(api.totalHeight.value).toBe(4 * 40 + 200)
  })

  it('expansion band height is added only when the row is expanded', () => {
    const expandedIds = new Set(['r1'])
    const { api } = setup({ rows: makeRows(3), estimatedRowHeight: 40, expandedIds })
    api.measureRow('r1', 40) // base
    api.measureRow('r1', 300, { expansion: true }) // inline expansion band

    expect(api.getRowHeight('r1')).toBe(40 + 300)
    expect(api.getRowHeight('r0')).toBe(40)
    expect(api.totalHeight.value).toBe(40 + (40 + 300) + 40)
  })

  it('ignores invalid measurements (non-finite / negative / nullish key)', () => {
    const { api } = setup({ rows: makeRows(3), estimatedRowHeight: 40 })
    api.measureRow('r0', NaN)
    api.measureRow('r0', -10)
    api.measureRow(null, 100)
    api.measureRow(undefined, 100)
    expect(api.totalHeight.value).toBe(3 * 40)
  })
})

describe('useRowWindow — scroll anchoring (req 1.7, §12.2)', () => {
  it('adjusts scroll by the delta when an ABOVE-fold row grows', () => {
    const onAnchorAdjust = vi.fn()
    const { api } = setup({
      rows: makeRows(1000),
      estimatedRowHeight: 40,
      overscan: 0,
      viewportHeight: 400,
      scrollTop: 4000, // first visible row = index 100
      onAnchorAdjust
    })

    // Grow a row far above the fold (index 10) by +60px.
    api.measureRow('r10', 100)
    expect(onAnchorAdjust).toHaveBeenCalledWith(60)
  })

  it('does NOT adjust scroll when the changed row is at/below the fold', () => {
    const onAnchorAdjust = vi.fn()
    const { api } = setup({
      rows: makeRows(1000),
      estimatedRowHeight: 40,
      overscan: 0,
      viewportHeight: 400,
      scrollTop: 4000, // first visible = index 100
      onAnchorAdjust
    })

    api.measureRow('r150', 100) // below the fold
    expect(onAnchorAdjust).not.toHaveBeenCalled()
  })

  it('reports a negative delta when an above-fold row shrinks', () => {
    const onAnchorAdjust = vi.fn()
    const { api } = setup({
      rows: makeRows(1000),
      estimatedRowHeight: 40,
      overscan: 0,
      viewportHeight: 400,
      scrollTop: 4000,
      onAnchorAdjust
    })
    api.measureRow('r5', 10) // 40 -> 10, delta -30
    expect(onAnchorAdjust).toHaveBeenCalledWith(-30)
  })
})

describe('useRowWindow — scrollToKey (req 1.7)', () => {
  it('returns the cumulative offset of a row identity', () => {
    const { api } = setup({ rows: makeRows(100), estimatedRowHeight: 40 })
    expect(api.scrollToKey('r0')).toBe(0)
    expect(api.scrollToKey('r10')).toBe(10 * 40)
  })

  it('accounts for measured heights before the target row', () => {
    const { api } = setup({ rows: makeRows(100), estimatedRowHeight: 40 })
    api.measureRow('r0', 200)
    // r1 now starts at 200, not 40.
    expect(api.scrollToKey('r1')).toBe(200)
  })

  it('returns null for an unknown key', () => {
    const { api } = setup({ rows: makeRows(10) })
    expect(api.scrollToKey('does-not-exist')).toBeNull()
  })
})

describe('useRowWindow — reset seam (req 1.7, §12.2)', () => {
  it('clears measured heights when resetToken changes', () => {
    const resetToken = ref(0)
    const { api } = setup({ rows: makeRows(10), estimatedRowHeight: 40, resetToken })
    api.measureRow('r0', 500)
    expect(api.getRowHeight('r0')).toBe(500)

    resetToken.value += 1
    expect(api.getRowHeight('r0')).toBe(40) // back to estimate
    expect(api.totalHeight.value).toBe(10 * 40)
  })

  it('forceRemeasure drops all measured heights (end of column resize)', () => {
    const { api } = setup({ rows: makeRows(10), estimatedRowHeight: 40 })
    api.measureRow('r0', 500)
    api.measureRow('r1', 300)
    api.forceRemeasure()
    expect(api.getRowHeight('r0')).toBe(40)
    expect(api.getRowHeight('r1')).toBe(40)
  })

  it('append (rows added, token unchanged) preserves existing measured heights', () => {
    const resetToken = ref(0)
    const { api, rowsRef } = setup({ rows: makeRows(10), estimatedRowHeight: 40, resetToken })
    api.measureRow('r5', 111)

    rowsRef.value = [...rowsRef.value, ...makeRows(5, 'appended')]
    // Token NOT bumped → measured height for r5 survives the append.
    expect(api.getRowHeight('r5')).toBe(111)
  })
})

describe('useRowWindow — dynamic estimate (req 1.6)', () => {
  it('reacts to a changed estimatedRowHeight ref', () => {
    const rowsRef = ref(makeRows(10))
    const estimate = ref(40)
    const api = useRowWindow({
      logicalRows: rowsRef,
      viewportHeight: () => 400,
      estimatedRowHeight: estimate,
      overscan: 0
    })
    expect(api.totalHeight.value).toBe(10 * 40)
    estimate.value = 60
    expect(api.totalHeight.value).toBe(10 * 60)
  })
})

/**
 * PROPERTY TEST — prefix-sum / binary-search correctness (≥100 iterations).
 *
 * Invariants proven for arbitrary row counts, heights, viewport, scroll and
 * overscan:
 *   (I1) topSpacer === Σ heights of rows before the window start.
 *   (I2) bottomSpacer === Σ heights of rows at/after the window end.
 *   (I3) topSpacer + Σ(rendered heights) + bottomSpacer === totalHeight.
 *   (I4) the window covers the visible viewport: the row at the viewport top
 *        offset and the row at the viewport bottom offset are both inside
 *        [start, end) (so binary search never drops a visible row).
 *   (I5) mounted rows ≤ visibleRows + 2*overscan + 1 (bounded window, req 1.1).
 */
describe('useRowWindow — prefix-sum + binary-search property (P: bounded/covering window)', () => {
  it('spacers, coverage and bound hold for arbitrary layouts (≥100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.record({
          count: fc.integer({ min: 1, max: 400 }),
          estimate: fc.integer({ min: 10, max: 80 }),
          overscan: fc.integer({ min: 0, max: 8 }),
          viewport: fc.integer({ min: 40, max: 600 }),
          // Sparse measured overrides so heights are genuinely variable.
          measured: fc.array(fc.tuple(fc.nat(), fc.integer({ min: 5, max: 400 })), {
            maxLength: 40
          }),
          scrollFraction: fc.double({ min: 0, max: 1, noNaN: true })
        }),
        ({ count, estimate, overscan, viewport, measured, scrollFraction }) => {
          const rows = makeRows(count)
          const scrollTopRef = ref(0)
          const api = useRowWindow({
            logicalRows: ref(rows),
            scrollTop: scrollTopRef,
            viewportHeight: () => viewport,
            estimatedRowHeight: estimate,
            overscan,
            keyOf: (row) => row.id
          })

          // Apply measured overrides (index mod count → id).
          const heightOf = new Map()
          for (const [rawIndex, height] of measured) {
            const index = rawIndex % count
            api.measureRow(rows[index].id, height)
          }
          for (let index = 0; index < count; index += 1) {
            heightOf.set(rows[index].id, api.getRowHeight(rows[index].id))
          }

          // Independent prefix-sum oracle.
          const oracle = [0]
          for (let index = 0; index < count; index += 1) {
            oracle.push(oracle[index] + heightOf.get(rows[index].id))
          }
          const total = oracle[count]

          // Place the scroll somewhere in range.
          const maxScroll = Math.max(0, total - viewport)
          scrollTopRef.value = Math.round(maxScroll * scrollFraction)

          const win = api.windowedRows.value
          const start = win.length ? win[0].index : 0
          const end = win.length ? win[win.length - 1].index + 1 : 0

          // (I1) topSpacer
          expect(api.topSpacer.value).toBe(oracle[start])
          // (I2) bottomSpacer
          expect(api.bottomSpacer.value).toBe(total - oracle[end])
          // (I3) partition identity
          const rendered = win.reduce((sum, { key }) => sum + heightOf.get(key), 0)
          expect(api.topSpacer.value + rendered + api.bottomSpacer.value).toBe(total)
          // totalHeight matches oracle
          expect(api.totalHeight.value).toBe(total)

          // (I4) coverage: the visible band [scrollTop, scrollTop+viewport)
          // is fully inside the mounted window.
          const top = scrollTopRef.value
          const findVisible = (targetOffset) => {
            // first row whose end offset > targetOffset
            for (let index = 0; index < count; index += 1) {
              if (oracle[index + 1] > targetOffset) return index
            }
            return count - 1
          }
          const firstVisibleIndex = findVisible(top)
          const lastVisibleIndex = findVisible(Math.min(total - 1, top + viewport - 1))
          expect(firstVisibleIndex).toBeGreaterThanOrEqual(start)
          expect(lastVisibleIndex).toBeLessThan(end)

          // (I5) bounded window size.
          const visibleRowSpan = lastVisibleIndex - firstVisibleIndex + 1
          expect(win.length).toBeLessThanOrEqual(visibleRowSpan + 2 * overscan + 2)
        }
      ),
      { numRuns: 200 }
    )
  })

  it('scrollToKey offset lands the row at the viewport top for arbitrary layouts (≥100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.record({
          count: fc.integer({ min: 1, max: 300 }),
          estimate: fc.integer({ min: 10, max: 80 }),
          targetFraction: fc.double({ min: 0, max: 1, noNaN: true })
        }),
        ({ count, estimate, targetFraction }) => {
          const rows = makeRows(count)
          const api = useRowWindow({
            logicalRows: ref(rows),
            viewportHeight: () => 100,
            estimatedRowHeight: estimate,
            overscan: 0,
            keyOf: (row) => row.id
          })
          const targetIndex = Math.min(count - 1, Math.floor(targetFraction * count))
          const offset = api.scrollToKey(rows[targetIndex].id)
          expect(offset).toBe(api.offsetOf(targetIndex))
          // offset is exactly the cumulative height of all rows before target.
          expect(offset).toBe(targetIndex * estimate)
        }
      ),
      { numRuns: 150 }
    )
  })
})
