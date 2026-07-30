import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useRowWindow } from '../useRowWindow.js'

const makeRows = (count) =>
  Array.from({ length: count }, (_unused, idx) => ({ id: `r${idx}`, ts: idx, tsFormat: `t${idx}` }))

describe('useRowWindow — viewportHeight=0 reproduces S1 (few rows mount)', () => {
  it('S1: viewportHeight=0 → only overscan+1 rows mount for a 500-row set', () => {
    const logicalRows = ref(makeRows(500))
    const scrollTop = ref(0)
    const viewportHeight = ref(0) // <-- the stuck value we suspect

    const { windowedRows, topSpacer, bottomSpacer, totalHeight } = useRowWindow({
      logicalRows,
      scrollTop,
      viewportHeight,
      estimatedRowHeight: 44,
      overscan: 6
    })

    // math: firstVisible=0, lastVisible=0, end = 0 + 1 + overscan(6) = 7
    expect(windowedRows.value.length).toBe(7)
    expect(topSpacer.value).toBe(0)
    // container IS tall (all 500 rows counted) → element would be scrollable...
    expect(totalHeight.value).toBe(500 * 44)
    expect(bottomSpacer.value).toBe(500 * 44 - 7 * 44)
  })

  it('healthy: viewportHeight=600 → ~20 rows mount (viewport-proportional)', () => {
    const logicalRows = ref(makeRows(500))
    const scrollTop = ref(0)
    const viewportHeight = ref(600)

    const { windowedRows } = useRowWindow({
      logicalRows,
      scrollTop,
      viewportHeight,
      estimatedRowHeight: 44,
      overscan: 6
    })
    // firstVisible=0, lastVisible=floor(600/44)=13, end=13+1+6=20
    expect(windowedRows.value.length).toBe(20)
  })

  it('the MATH is reactive to scrollTop (so windowing itself is not the bug)', async () => {
    const logicalRows = ref(makeRows(500))
    const scrollTop = ref(0)
    const viewportHeight = ref(600)

    const { windowedRows } = useRowWindow({
      logicalRows,
      scrollTop,
      viewportHeight,
      estimatedRowHeight: 44,
      overscan: 6
    })
    const firstKeys = windowedRows.value.map((win) => win.key)
    expect(firstKeys[0]).toBe('r0')

    scrollTop.value = 4400 // scroll down ~100 rows
    await nextTick()
    const scrolledKeys = windowedRows.value.map((win) => win.key)
    // window followed the scroll (proves reactivity + correctness)
    expect(scrolledKeys).not.toContain('r0')
    expect(scrolledKeys).toContain('r100')
  })

  it('S1 consequence: with viewportHeight=0, even scrolling only ever mounts ~2*overscan+1 rows', async () => {
    const logicalRows = ref(makeRows(500))
    const scrollTop = ref(0)
    const viewportHeight = ref(0)

    const { windowedRows } = useRowWindow({
      logicalRows,
      scrollTop,
      viewportHeight,
      estimatedRowHeight: 44,
      overscan: 6
    })

    scrollTop.value = 4400
    await nextTick()
    // firstVisible=lastVisible=100 → [100-6 , 100+1+6] = 13 rows. Never a full page.
    expect(windowedRows.value.length).toBe(13)
  })
})
