import { ref, nextTick } from 'vue'

const STORAGE_KEY = 'rte-detail-view-mode'

function loadMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'sidebar'
  } catch {
    return 'sidebar'
  }
}

function persistMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* noop */
  }
}

/**
 * Composable for managing detail view (inline expansion vs sidebar),
 * row selection, keyboard navigation, and fullscreen toggle.
 *
 * Selection is **identity-based** (task 3.10 / design §2.1(1)): active, expanded
 * and keyboard-focused rows are tracked by `row.id`, not by positional index.
 * The virtualized table (`VirtualEventTable` + `useRowWindow`) recycles DOM by
 * `row.id`, so a positional focus/selection would be re-attributed to the wrong
 * row the moment the window recycles or the logical set reorders/shrinks. Keying
 * on identity makes selection survive recycle/reorder: the same *row* stays
 * selected even if it moves to a new position (or off-window entirely).
 *
 * `expandedRows` stays an ARRAY OF ROW OBJECTS on the public surface — that is
 * the drop-in contract the table props/emits and `tab-panel-block` depend on
 * (design §12.3). Internally expansion is still compared by id.
 */
export function useDetailView(tableData) {
  const mode = ref(loadMode())
  const activeRow = ref(null)
  const isLoading = ref(false)
  const sidebarVisible = ref(false)
  const expandedRows = ref([])
  // Keyboard-focused row by IDENTITY (null = nothing focused). Replaces the old
  // positional `focusedRowIndex`: under DOM recycling / reorder / shrink a fixed
  // index would point at a different row after the buffer changes, so we pin the
  // id and derive the current index on demand from the live `tableData`.
  const focusedId = ref(null)
  const isFullscreen = ref(false)
  const tableContainerRef = ref(null)

  const rowsOf = () => tableData.value || []
  const focusedIndex = () =>
    focusedId.value == null ? -1 : rowsOf().findIndex((row) => row.id === focusedId.value)

  const isRowExpanded = (row) => expandedRows.value.some((expandedRow) => expandedRow.id === row.id)
  const isRowActive = (row) => activeRow.value?.id === row.id
  const isRowFocused = (row) => focusedId.value != null && row.id === focusedId.value

  const toggleMode = () => {
    const newMode = mode.value === 'inline' ? 'sidebar' : 'inline'
    mode.value = newMode
    persistMode(newMode)
    if (newMode === 'sidebar' && expandedRows.value.length > 0) {
      activeRow.value = expandedRows.value[expandedRows.value.length - 1]
      sidebarVisible.value = true
      expandedRows.value = []
    }
    if (newMode === 'inline' && activeRow.value) {
      expandedRows.value = [activeRow.value]
      sidebarVisible.value = false
    }
  }

  const selectRow = (row) => {
    if (mode.value === 'inline') {
      activeRow.value = row
      expandedRows.value = isRowExpanded(row) ? [] : [row]
      if (!expandedRows.value.length) activeRow.value = null
    } else {
      // In sidebar mode: if the row is already active, close the sidebar
      if (sidebarVisible.value && activeRow.value?.id === row.id) {
        sidebarVisible.value = false
        activeRow.value = null
      } else {
        activeRow.value = row
        sidebarVisible.value = true
      }
    }
  }

  const closeSidebar = () => {
    sidebarVisible.value = false
    activeRow.value = null
  }

  const navigate = (direction) => {
    const rows = rowsOf()
    if (!activeRow.value || !rows.length) return
    const idx = rows.findIndex((row) => row.id === activeRow.value.id)
    if (idx === -1) return
    const newIdx = idx + direction
    if (newIdx >= 0 && newIdx < rows.length) {
      const nextRow = rows[newIdx]
      activeRow.value = nextRow
      focusedId.value = nextRow.id
      if (mode.value === 'inline') expandedRows.value = [nextRow]
    }
  }

  const getRowClass = (row) => {
    const classes = []
    if (isRowActive(row)) classes.push('row--active')
    if (isRowExpanded(row)) classes.push('row--expanded')
    if (isRowFocused(row)) classes.push('row--focused')
    return classes.join(' ')
  }

  const handleKeyDown = (event) => {
    const rows = rowsOf()
    if (!rows.length) return
    // This is a document-level listener. Ignore keystrokes that originate from
    // an editable element (the AQL query input, the document-search field, any
    // input/textarea/select) — otherwise arrow keys used to navigate the AQL
    // suggestions or to move the caret would also move the table's focused row.
    const target = event.target
    const isEditableTarget =
      target?.isContentEditable ||
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'SELECT'
    if (isEditableTarget) return
    const { key } = event
    // Resolve the current focused position from identity each keypress, so a
    // reorder/shrink between keystrokes moves relative to the SAME row (not a
    // stale index). -1 (nothing focused) with ArrowDown lands on the first row;
    // with ArrowUp it stays clamped at the first row (matches prior behavior of
    // Math.max(-1 - 1, 0) === 0 → first row).
    const idx = focusedIndex()
    if (key === 'ArrowDown') {
      event.preventDefault()
      const nextIdx = Math.min(idx + 1, rows.length - 1)
      focusedId.value = rows[nextIdx].id
      scrollToFocused()
    } else if (key === 'ArrowUp') {
      event.preventDefault()
      const nextIdx = Math.max(idx - 1, 0)
      focusedId.value = rows[nextIdx].id
      scrollToFocused()
    } else if (key === 'Enter' && idx >= 0) {
      event.preventDefault()
      const row = rows[idx]
      if (row) selectRow(row)
    } else if (key === 'Escape') {
      event.preventDefault()
      if (sidebarVisible.value) closeSidebar()
      else if (expandedRows.value.length) {
        expandedRows.value = []
        activeRow.value = null
      }
    }
  }

  const scrollToFocused = () => {
    nextTick(() => {
      if (focusedId.value == null) return
      // Prefer the identity-addressed row: under windowing the rendered rows are
      // a moving slice, so a positional `querySelectorAll(...)[index]` would miss
      // (or hit the wrong node). Match the row whose data-id equals the focused
      // id. Fall back to positional lookup only if rows are not id-tagged in DOM
      // (preserves the data-testid="table-body-row" grep contract either way).
      const container = tableContainerRef.value
      const domRows = container?.querySelectorAll('[data-testid="table-body-row"]')
      if (!domRows || !domRows.length) return
      const byId = container.querySelector(
        `[data-testid="table-body-row"][data-row-id="${CSS?.escape ? CSS.escape(String(focusedId.value)) : focusedId.value}"]`
      )
      const target = byId || domRows[focusedIndex()]
      target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  const resetSelection = () => {
    expandedRows.value = []
    activeRow.value = null
    sidebarVisible.value = false
    focusedId.value = null
  }

  return {
    mode,
    activeRow,
    isLoading,
    sidebarVisible,
    expandedRows,
    focusedId,
    isFullscreen,
    tableContainerRef,
    isRowExpanded,
    isRowActive,
    isRowFocused,
    toggleMode,
    selectRow,
    closeSidebar,
    navigate,
    getRowClass,
    handleKeyDown,
    resetSelection
  }
}
