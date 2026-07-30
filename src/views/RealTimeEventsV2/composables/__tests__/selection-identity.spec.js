import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useDetailView } from '../useDetailView.js'

/**
 * Feature: real-time-events-v2-refactor — task 3.10 (Property P10).
 *
 * Validates: Requirement 4.13 — selection / active / expanded / focused survive
 * IDENTITY under recycle / reorder / shrink of the logical row set.
 *
 * Why identity (design §2.1(1)): the virtualized table (`VirtualEventTable` +
 * `useRowWindow`) recycles DOM by `row.id` and the logical set can reorder or
 * shrink (new query, eviction). A POSITIONAL selection (`focusedRowIndex`)
 * would re-attribute state to whatever row now sits at that index; keying on
 * `row.id` keeps the SAME row selected regardless of where it moves.
 *
 * `useDetailView` owns no DOM, so these tests drive it directly (no mount).
 */

const makeRow = (id, ts = id) => ({
  id: String(id),
  ts,
  tsFormat: `fmt-${ts}`,
  summary: []
})

describe('selection identity (P10) — useDetailView', () => {
  let storage

  beforeEach(() => {
    storage = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => storage[key] ?? null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => {
      storage[key] = val
    })
    // Default persisted mode = sidebar; individual tests toggle to inline.
    storage['rte-detail-view-mode'] = 'sidebar'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('active row survives reorder', () => {
    it('keeps the SAME row active after the buffer reorders', () => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')]
      const tableData = ref(rows)
      const dv = useDetailView(tableData)

      dv.selectRow(rows[1]) // select "b" (index 1)
      expect(dv.activeRow.value.id).toBe('b')
      expect(dv.isRowActive({ id: 'b' })).toBe(true)

      // Reorder: "b" moves from index 1 to index 0.
      tableData.value = [rows[1], rows[2], rows[0]]

      // Still "b" that is active — a positional model would now report "c".
      expect(dv.activeRow.value.id).toBe('b')
      expect(dv.isRowActive({ id: 'b' })).toBe(true)
      expect(dv.isRowActive({ id: 'c' })).toBe(false)
    })
  })

  describe('focused row survives reorder / recycle', () => {
    it('ArrowDown after a reorder moves relative to the focused ROW, not a stale index', () => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c'), makeRow('d')]
      const tableData = ref(rows)
      const dv = useDetailView(tableData)

      dv.focusedId.value = 'b'

      // Reorder so "b" is now at index 2: [c, a, b, d].
      tableData.value = [rows[2], rows[0], rows[1], rows[3]]

      // ArrowDown moves to the row AFTER "b" in the NEW order → "d".
      dv.handleKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() })
      expect(dv.focusedId.value).toBe('d')
    })

    it('getRowClass reports row--focused by identity, not position', () => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')]
      const tableData = ref(rows)
      const dv = useDetailView(tableData)

      dv.focusedId.value = 'c'
      // Recycle/reorder: "c" jumps to the front.
      tableData.value = [rows[2], rows[0], rows[1]]

      expect(dv.getRowClass({ id: 'c' })).toContain('row--focused')
      expect(dv.getRowClass({ id: 'a' })).not.toContain('row--focused')
    })

    it('focus on a row that gets EVICTED collapses to "nothing focused"', () => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')]
      const tableData = ref(rows)
      const dv = useDetailView(tableData)

      dv.focusedId.value = 'a'
      // "a" is evicted (oldest trimmed) — set no longer contains it.
      tableData.value = [rows[1], rows[2]]

      // The focused id resolves to index -1; ArrowDown lands on the first row.
      dv.handleKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() })
      expect(dv.focusedId.value).toBe('b')
    })
  })

  describe('expanded rows survive reorder (array-of-objects contract preserved)', () => {
    it('keeps the expansion attached to the SAME row id after reorder', () => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')]
      const tableData = ref(rows)
      const dv = useDetailView(tableData)
      dv.toggleMode() // inline mode → selectRow expands
      dv.selectRow(rows[2]) // expand "c"

      expect(dv.expandedRows.value).toHaveLength(1)
      expect(dv.expandedRows.value[0].id).toBe('c')
      expect(dv.isRowExpanded({ id: 'c' })).toBe(true)

      // Reorder: "c" to the front.
      tableData.value = [rows[2], rows[0], rows[1]]

      // expandedRows stays an ARRAY OF ROW OBJECTS (drop-in contract) and still
      // targets "c" by identity.
      expect(Array.isArray(dv.expandedRows.value)).toBe(true)
      expect(dv.isRowExpanded({ id: 'c' })).toBe(true)
      expect(dv.isRowExpanded({ id: 'a' })).toBe(false)
    })
  })

  describe('navigate() is identity-based', () => {
    it('moves relative to the active row id even after a reorder', () => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c'), makeRow('d')]
      const tableData = ref(rows)
      const dv = useDetailView(tableData)

      dv.selectRow(rows[0]) // active "a"
      // Reorder: [b, a, c, d] — "a" now at index 1.
      tableData.value = [rows[1], rows[0], rows[2], rows[3]]

      dv.navigate(1) // next after "a" in NEW order → "c"
      expect(dv.activeRow.value.id).toBe('c')

      dv.navigate(-1) // back to "a"
      expect(dv.activeRow.value.id).toBe('a')
    })
  })
})
