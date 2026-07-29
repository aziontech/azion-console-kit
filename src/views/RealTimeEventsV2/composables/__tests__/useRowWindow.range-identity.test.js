import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useRowWindow } from '../useRowWindow.js'

/**
 * Regression for the range-identity memo (the "Page Unresponsive" freeze fix).
 * A measurement that invalidates `offsets` but does NOT move start/end must
 * return the SAME `windowedRows` reference, so the <v-for> and its row refs are
 * not re-created (which re-armed the measure→render→re-measure loop).
 */

const makeRows = (count, prefix = 'r') =>
  Array.from({ length: count }, (unused, index) => ({ id: `${prefix}${index}`, index }))

function setup({ rows = makeRows(50), viewportHeight = 400, scrollTop = 0 } = {}) {
  const rowsRef = ref(rows)
  const scrollTopRef = ref(scrollTop)
  const viewportRef = ref(viewportHeight)

  const api = useRowWindow({
    logicalRows: rowsRef,
    scrollTop: scrollTopRef,
    viewportHeight: viewportRef,
    keyOf: (row) => row.id
  })

  return { api, rowsRef, scrollTopRef, viewportRef }
}

describe('useRowWindow — range-identity memo (freeze fix regression)', () => {
  it('keeps the SAME windowedRows reference across a no-op measure inside the window', () => {
    const { api } = setup()
    const initial = api.windowedRows.value
    // Row 10 is inside the mounted window but past the visible boundary, so its
    // height change invalidates `offsets` without moving start/end.
    expect(initial.some(({ key }) => key === 'r10')).toBe(true)

    api.measureRow('r10', 60)
    expect(api.windowedRows.value).toBe(initial)
  })

  it('keeps range identity stable across successive no-op recomputes', () => {
    const { api } = setup()
    const initial = api.windowedRows.value

    api.measureRow('r10', 60)
    api.measureRow('r11', 70)
    expect(api.windowedRows.value).toBe(initial)
  })

  it('CHANGES the windowedRows reference when scroll moves the window', () => {
    const { api, scrollTopRef } = setup()
    const initial = api.windowedRows.value

    scrollTopRef.value = 1200
    const moved = api.windowedRows.value
    expect(moved).not.toBe(initial)
    expect(moved[0].index).toBeGreaterThan(initial[0].index)
  })
})
