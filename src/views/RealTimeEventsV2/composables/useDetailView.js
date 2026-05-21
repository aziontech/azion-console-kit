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
 */
export function useDetailView(tableData) {
  const mode = ref(loadMode())
  const activeRow = ref(null)
  const isLoading = ref(false)
  const sidebarVisible = ref(false)
  const expandedRows = ref([])
  const focusedRowIndex = ref(-1)
  const isFullscreen = ref(false)
  const tableContainerRef = ref(null)

  const isRowExpanded = (row) => expandedRows.value.some((expandedRow) => expandedRow.id === row.id)
  const isRowActive = (row) => activeRow.value?.id === row.id

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
    if (!activeRow.value || !tableData.value.length) return
    const idx = tableData.value.findIndex((row) => row.id === activeRow.value.id)
    if (idx === -1) return
    const newIdx = idx + direction
    if (newIdx >= 0 && newIdx < tableData.value.length) {
      activeRow.value = tableData.value[newIdx]
      focusedRowIndex.value = newIdx
      if (mode.value === 'inline') expandedRows.value = [tableData.value[newIdx]]
    }
  }

  const getRowClass = (row) => {
    const classes = []
    if (isRowActive(row)) classes.push('row--active')
    if (isRowExpanded(row)) classes.push('row--expanded')
    if (tableData.value[focusedRowIndex.value]?.id === row.id) classes.push('row--focused')
    return classes.join(' ')
  }

  const handleKeyDown = (event) => {
    if (!tableData.value.length) return
    const { key } = event
    if (key === 'ArrowDown') {
      event.preventDefault()
      focusedRowIndex.value = Math.min(focusedRowIndex.value + 1, tableData.value.length - 1)
      scrollToFocused()
    } else if (key === 'ArrowUp') {
      event.preventDefault()
      focusedRowIndex.value = Math.max(focusedRowIndex.value - 1, 0)
      scrollToFocused()
    } else if (key === 'Enter' && focusedRowIndex.value >= 0) {
      event.preventDefault()
      const row = tableData.value[focusedRowIndex.value]
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
      const rows = tableContainerRef.value?.querySelectorAll('[data-testid="table-body-row"]')
      rows?.[focusedRowIndex.value]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  const resetSelection = () => {
    expandedRows.value = []
    activeRow.value = null
    sidebarVisible.value = false
    focusedRowIndex.value = -1
  }

  return {
    mode,
    activeRow,
    isLoading,
    sidebarVisible,
    expandedRows,
    focusedRowIndex,
    isFullscreen,
    tableContainerRef,
    isRowExpanded,
    isRowActive,
    toggleMode,
    selectRow,
    closeSidebar,
    navigate,
    getRowClass,
    handleKeyDown,
    resetSelection
  }
}
