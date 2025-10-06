<template>
  <div
    :style="{
      position: 'fixed',
      top: cellQuickActions.posY + 'px',
      left: cellQuickActions.posX + 'px',
      zIndex: 10
    }"
    class="popup-container"
    @mouseenter="onPopupMouseEnter"
    @mouseleave="onPopupMouseLeave"
    :class="{ visible: cellQuickActions.visible }"
  >
    <button
      v-for="item in quickActions"
      :key="item.title"
      @click="item.action(cellQuickActions.rowData)"
      :title="item.title"
      class="px-2"
    >
      <i :class="item.icon"></i>
    </button>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, watch } from 'vue'
  import { useToast } from 'primevue/usetoast'

  const emit = defineEmits(['quick-actions-visible'])

  const props = defineProps({
    columns: {
      type: Array,
      default: () => []
    },
    data: {
      type: Array,
      default: () => []
    },
    selectedItensData: {
      type: [Array, Object],
      default: undefined
    },
    reorderableRows: {
      type: Boolean,
      default: false
    },
    cellQuickActionsItens: {
      type: Array,
      default: () => []
    }
  })

  const toast = useToast()

  // Cell quick actions state
  const cellQuickActions = ref({
    visible: false,
    text: '',
    posX: 0,
    posY: 0,
    rowData: null
  })

  const hoverTimeout = ref(null)
  const hideTimeout = ref(null)
  const activeCellElement = ref(null)
  const pendingCellElement = ref(null)

  function copyToClipboard() {
    navigator.clipboard
      .writeText(cellQuickActions.value.text)
      .then(() => {
        toast.add({
          severity: 'success',
          summary: 'Copied',
          detail: 'Text copied to clipboard',
          life: 3000
        })
        cellQuickActions.value.visible = false
      })
      .catch(() => {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy text',
          life: 3000
        })
      })
  }

  // Quick actions configuration
  const quickActions = ref([
    {
      title: 'Copy to clipboard',
      icon: 'pi pi-copy',
      action: copyToClipboard
    },
    ...(props.cellQuickActionsItens || [])
  ])

  function setupCellEventHandlers() {
    setTimeout(() => {
      if (!props.columns || !Array.isArray(props.columns)) {
        return
      }

      const columnsWithQuickActions = props.columns
        .map((col, index) => ({ ...col, index }))
        .filter((col) => col.quickActions === true)

      if (!columnsWithQuickActions?.length) {
        return
      }

      let rows = document.querySelectorAll('.table-with-orange-borders .p-datatable-tbody tr')
      if (!rows.length) {
        rows = document.querySelectorAll('[data-testid="data-table"] tbody tr')
      }
      if (!rows.length) {
        rows = document.querySelectorAll('.p-datatable-tbody tr')
      }
      if (!rows.length) {
        rows = document.querySelectorAll('table tbody tr')
      }

      rows.forEach((row, rowIndex) => {
        columnsWithQuickActions.forEach((column) => {
          // Adjust column index based on component type
          let cellIndex = column.index

          // For folder-list component, add 1 for the checkbox column
          if (props.selectedItensData !== undefined && !props.reorderableRows) {
            cellIndex = column.index + 1
          }

          const cell = row.children[cellIndex]
          if (cell && !cell.classList.contains('p-frozen-column')) {
            cell.addEventListener('mouseenter', onCellMouseEnter)
            cell.addEventListener('mouseleave', onCellMouseLeave)
            cell.setAttribute('data-quick-actions', 'true')
            cell.setAttribute('data-row-index', rowIndex)
          }
        })
      })
    }, 500)
  }

  function onScroll() {
    if (cellQuickActions.value.visible) {
      cellQuickActions.value.visible = false

      if (activeCellElement.value) {
        activeCellElement.value.classList.remove('cell-active-hover')
        activeCellElement.value = null
      }

      if (hoverTimeout.value) {
        clearTimeout(hoverTimeout.value)
        hoverTimeout.value = null
      }

      if (hideTimeout.value) {
        clearTimeout(hideTimeout.value)
      }

      pendingCellElement.value = null
    }
  }

  function onCellMouseEnter(event) {
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
    }
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
    }

    const cellElement = event.currentTarget

    if (cellElement.classList.contains('p-frozen-column')) {
      return
    }

    // Clear any existing active cell and popup
    if (activeCellElement.value) {
      activeCellElement.value.classList.remove('cell-active-hover')
    }
    cellQuickActions.value.visible = false

    pendingCellElement.value = cellElement

    hoverTimeout.value = setTimeout(() => {
      if (pendingCellElement.value === cellElement) {
        activeCellElement.value = cellElement

        const rect = cellElement.getBoundingClientRect()
        const cellText = cellElement.textContent?.trim() || 'N/A'
        const rowIndex = parseInt(cellElement.getAttribute('data-row-index') || '0')
        const currentRowData = props.data[rowIndex] || null

        // Don't show quick actions for folder rows in folder-list component
        if (currentRowData?.isFolder) {
          return
        }

        cellQuickActions.value = {
          visible: true,
          text: cellText,
          posX: rect.left,
          posY: rect.top - 28,
          rowData: currentRowData
        }

        cellElement.classList.add('cell-active-hover')
      }
    }, 1000)
  }

  function onCellMouseLeave() {
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
      hoverTimeout.value = null
    }

    pendingCellElement.value = null

    hideTimeout.value = setTimeout(() => {
      cellQuickActions.value.visible = false

      if (activeCellElement.value) {
        activeCellElement.value.classList.remove('cell-active-hover')
        activeCellElement.value = null
      }
    }, 150)
  }

  function onPopupMouseEnter() {
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
    }

    if (activeCellElement.value) {
      activeCellElement.value.classList.add('cell-active-hover')
    }
  }

  function onPopupMouseLeave() {
    cellQuickActions.value.visible = false

    if (activeCellElement.value) {
      activeCellElement.value.classList.remove('cell-active-hover')
      activeCellElement.value = null
    }
  }

  // Watch for data changes to setup event handlers
  watch(
    () => props.data,
    (newData) => {
      if (newData && newData.length) {
        setupCellEventHandlers()
      }
    },
    { deep: true }
  )

  watch(
    () => cellQuickActions.value.visible,
    (newValue) => {
      emit('quick-actions-visible', newValue)
    }
  )
  // Setup scroll listener
  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)

    // Cleanup timeouts
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
    }
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
    }
  })

  defineExpose({
    setupCellEventHandlers,
    cellQuickActions
  })
</script>

<style scoped lang="scss">
  .popup-container {
    background-color: #f97316;
    color: white;
    padding: 4px;
    border-radius: 6px 6px 0 0;
    display: flex;
    align-items: center;
    gap: 2px;
    pointer-events: auto;
    transform-origin: bottom;
    transform: scaleY(0);
    opacity: 0;
    height: 30px;
    transition:
      transform 0.3s ease,
      opacity 0.2s ease;
    &.visible {
      opacity: 1;
      transform: scaleY(1);
    }
  }
</style>
