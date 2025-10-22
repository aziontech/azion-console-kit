import { FilterMatchMode } from 'primevue/api'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDeleteDialog } from '@/composables/useDeleteDialog'
import { useDialog } from 'primevue/usedialog'
import { useToast } from 'primevue/usetoast'
import { useTableDefinitionsStore } from '@/stores/table-definitions'
import { getCsvCellContentFromRowData } from '@/helpers'

export function useDataTable(props, emit) {
  const router = useRouter()
  const toast = useToast()
  const dialog = useDialog()
  const { openDeleteDialog } = useDeleteDialog()
  const tableDefinitions = useTableDefinitionsStore()

  // Reactive variables
  const isLoading = ref(false)
  const data = ref([])
  const selectedColumns = ref([])
  const selectedId = ref(null)
  const dataTableRef = ref(null)
  const columnSelectorPanel = ref(null)
  const menuRef = ref({})
  const firstLoadData = ref(true)
  const totalRecords = ref(0)
  const savedSearch = ref('')
  const savedOrdering = ref('')
  const firstItemIndex = ref(0)
  const lastModifiedToggled = ref(false)
  const expandedGroups = ref(props.expandedRowGroups || [])

  // Filters
  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })

  // Pagination
  const getSpecificPageCount = computed(() => {
    if (props.rowsPerPageOptions?.length === 1) {
      return props.rowsPerPageOptions[0]
    }
    return tableDefinitions.getNumberOfLinesPerPage
  })

  const itemsByPage = ref(getSpecificPageCount.value || 10)
  const minimumOfItemsPerPage = ref(tableDefinitions.getNumberOfLinesPerPage)

  // Selection management
  const selectedItems = computed({
    get: () => props.selectedItensData || [],
    set: (value) => emit('update:selectedItensData', value)
  })

  // Actions configuration
  const isRenderActions = computed(() => !!props.actions?.length)
  const isRenderOneOption = computed(() => props.actions?.length === 1)
  const hasExportToCsvMapper = computed(() => !!props.csvMapper)

  // Filters configuration
  const filterBy = computed(() => {
    const columns = Array.isArray(props.columns) ? props.columns : props.columns?.value || []
    const filtersPath = columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const columnFilters = columns.map((item) => item.field)
    return [...columnFilters, ...filtersPath]
  })

  const filtersDynamically = computed(() => {
    return props.lazy ? {} : filters.value
  })

  // Row styling
  const getRowClass = computed(() => {
    return (rowData) => {
      if (props.showContrastInactiveLine && rowData?.active?.content === 'Inactive') {
        return 'opacity-50'
      }
      if (props.showContrastInactiveLine && rowData?.status?.content === 'Inactive') {
        return 'opacity-50'
      }
      return ''
    }
  })

  const stateClassRules = (rowData) => {
    if (selectedItems.value.find((item) => item.id === rowData.id)) {
      return 'bg-[var(--table-body-row-hover-bg)] bg-altered'
    }
    if (rowData.position?.altered) {
      return 'bg-altered'
    }
    if (props.showContrastInactiveLine && rowData.status?.content === 'Inactive') {
      return 'opacity-50'
    }
    return ''
  }

  // Data loading
  const loadData = async ({ page, ...query } = {}, service = null) => {
    try {
      isLoading.value = true
      const serviceToUse = service || props.listService

      if (serviceToUse) {
        const result = props.isGraphql
          ? await serviceToUse()
          : await serviceToUse({ page, ...query })

        const { count = 0, body = [] } = result || {}
        data.value = Array.isArray(result) ? result : body
        totalRecords.value = count
      }
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        const errorMessage = error.message || error
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        })
      }
    } finally {
      isLoading.value = false
      if (firstLoadData.value) {
        const hasData = data.value?.length > 0
        emit('on-load-data', !!hasData)
      }
      firstLoadData.value = false
    }
  }

  const reload = async (query = {}, listService = null) => {
    if (!savedOrdering.value && props.defaultOrderingFieldName) {
      savedOrdering.value = props.defaultOrderingFieldName
    }

    const commonParams = {
      page: 1,
      pageSize: itemsByPage.value,
      fields: props.apiFields || [],
      ordering: savedOrdering.value,
      ...query
    }

    if (props.lazy) {
      commonParams.search = savedSearch.value
    }

    await loadData(commonParams, listService)
  }

  // Navigation
  const navigateToAddPage = () => {
    emit('on-before-go-to-add-page')
    router.push(props.createPagePath || '/')
  }

  const editItemSelected = (event, item) => {
    emit('on-before-go-to-edit', item)

    if (props.editInDrawer) {
      props.editInDrawer(item)
    } else if (props.enableEditClick !== false && !item?.disableEditClick) {
      const editPath = `${props.editPagePath}/${item.id}`

      if (event.ctrlKey || event.metaKey) {
        const fullUrl = `${window.location.origin}${editPath}`
        window.open(fullUrl, '_blank')
      } else {
        router.push({ path: editPath })
      }
    }
  }

  // Actions management
  const openDialog = (dialogComponent, body) => {
    dialog.open(dialogComponent, body)
  }

  const actionOptions = (rowData) => {
    const createActionOption = (action) => {
      return {
        ...action,
        disabled: action.disabled && action.disabled(rowData),
        command: () => {
          switch (action.type) {
            case 'dialog':
              openDialog(action.dialog.component, action.dialog.body(rowData, reload))
              break
            case 'delete':
              openDeleteDialog({
                title: action.title,
                id: rowData.id,
                data: rowData,
                deleteService: action.service,
                deleteConfirmationText: undefined,
                closeCallback: (opt) => {
                  if (opt.data.updated) {
                    reload()
                    updateDataTablePagination()
                  }
                }
              })
              break
            case 'action':
              action.commandAction(rowData)
              break
          }
        }
      }
    }

    return (props.actions || [])
      .filter((action) => !action.visibleAction || action.visibleAction(rowData))
      .map(createActionOption)
  }

  const executeCommand = (rowData) => {
    const [firstAction] = actionOptions(rowData)
    firstAction?.command()
  }

  const optionsOneAction = (rowData) => {
    const [firstAction] = actionOptions(rowData)
    return {
      icon: firstAction?.icon,
      disabled: firstAction?.disabled
    }
  }

  const toggleActionsMenu = (event, selectedID) => {
    if (!selectedID) {
      throw new Error('Please provide an id for each data item through the service adapter')
    }
    selectedId.value = selectedID
    menuRef.value[selectedID].toggle(event)
  }

  const setMenuRefForRow = (rowDataID) => {
    return (document) => {
      if (document !== null) {
        menuRef.value[rowDataID] = document
      }
    }
  }

  // Column management
  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  // Pagination
  const changeNumberOfLinesPerPage = (event) => {
    const numberOfLinesPerPage = event.rows
    tableDefinitions.setNumberOfLinesPerPage(numberOfLinesPerPage)
    itemsByPage.value = numberOfLinesPerPage
    minimumOfItemsPerPage.value = numberOfLinesPerPage
    firstItemIndex.value = event.first

    if (props.lazy) {
      reload({ page: event.page + 1 })
    }
  }

  const updateDataTablePagination = () => {
    const FIRST_NUMBER_PAGE = 1
    firstItemIndex.value = FIRST_NUMBER_PAGE
  }

  // Sorting
  const sortFieldValue = ref(null)
  const sortOrderValue = ref(null)

  const fetchOnSort = async (event) => {
    const { sortField, sortOrder } = event
    let ordering = sortOrder === -1 ? `-${sortField}` : sortField
    ordering = ordering === null ? props.defaultOrderingFieldName : ordering
    const firstPage = 1
    firstItemIndex.value = firstPage
    await reload({ ordering })
    savedOrdering.value = ordering
    sortFieldValue.value = sortField
    sortOrderValue.value = sortOrder
  }

  const sortByLastModified = () => {
    const currentField = sortFieldValue.value
    const currentOrder = sortOrderValue.value

    if (currentField === 'lastModified') {
      sortOrderValue.value = currentOrder === 1 ? -1 : 1
    } else {
      sortFieldValue.value = 'lastModified'
      sortOrderValue.value = 1
    }

    fetchOnSort({
      sortField: sortFieldValue.value,
      sortOrder: sortOrderValue.value
    })
  }

  // Search
  const fetchOnSearch = () => {
    if (!props.lazy) return
    const firstPage = 1
    firstItemIndex.value = firstPage
    reload()
  }

  const handleSearchValue = () => {
    const search = filters.value.global.value
    savedSearch.value = search
  }

  // Last Modified Toggle
  const loadLastModifiedToggleState = () => {
    const saved = localStorage.getItem('lastModifiedToggled')
    if (saved !== null) {
      lastModifiedToggled.value = JSON.parse(saved)
    }
  }

  const saveLastModifiedToggleState = () => {
    localStorage.setItem('lastModifiedToggled', JSON.stringify(lastModifiedToggled.value))
  }

  const toggleLastModifiedDisplay = () => {
    lastModifiedToggled.value = !lastModifiedToggled.value
    saveLastModifiedToggleState()
  }

  // CSV Export
  const exportFunctionMapper = (rowData) => {
    if (!hasExportToCsvMapper.value) return
    const columnMapper = props.csvMapper(rowData)
    return getCsvCellContentFromRowData({ columnMapper, rowData })
  }

  const handleExportTableDataToCSV = () => {
    dataTableRef.value?.exportCSV()
  }

  // Utility functions
  const extractFieldValue = (rowData, field) => {
    return rowData[field]
  }

  const getObjectPath = (obj, path) => {
    return path?.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  // Row reordering
  const moveItem = (originalData, referenceArray, fromIndex, toIndex) => {
    const originalArray = [...originalData]
    const oldItemMove = toIndex + Math.sign(fromIndex - toIndex)
    const itemToMoveId = referenceArray[toIndex]
    const targetItemId = referenceArray[oldItemMove]

    const originalItemIndex = originalArray.findIndex((item) => item.id === itemToMoveId.id)
    const targetItemIndex = originalArray.findIndex((item) => item.id === targetItemId.id)

    const [itemToMove] = originalArray.splice(originalItemIndex, 1)
    originalArray.splice(targetItemIndex, 0, itemToMove)

    return originalArray
  }

  const onRowReorder = async (event) => {
    emit('on-reorder', { event, data, moveItem })
  }

  // Selection management for folder-list style
  const toggleRowSelection = (rowData) => {
    const isSelected = selectedItems.value.includes(rowData)
    if (isSelected) {
      selectedItems.value = selectedItems.value.filter((item) => item !== rowData)
    } else {
      selectedItems.value = [...selectedItems.value, rowData]
    }
  }

  const toggleSelectAll = () => {
    const selectableRows = data.value.filter((row) => !row.isFolder)
    const isAllSelected =
      selectableRows.length > 0 && selectableRows.every((row) => selectedItems.value.includes(row))

    if (isAllSelected) {
      selectedItems.value = []
    } else {
      selectedItems.value = [...selectableRows]
    }
  }

  const isAllSelected = computed(() => {
    const selectableRows = data.value.filter((row) => !row.isFolder)
    return (
      selectableRows.length > 0 && selectableRows.every((row) => selectedItems.value.includes(row))
    )
  })

  // Group management for v2 style
  const toggleGroup = (groupData) => {
    if (!props.groupColumn) return
    const groupValue = getObjectPath(groupData, props.groupColumn)
    const index = expandedGroups.value.indexOf(groupValue)

    if (index === -1) {
      expandedGroups.value.push(groupValue)
    } else {
      expandedGroups.value.splice(index, 1)
    }
  }

  // Initialize
  onMounted(() => {
    if (!props.loadDisabled) {
      const initialParams = {
        page: 1,
        pageSize: itemsByPage.value,
        fields: props.apiFields || [],
        ordering: props.defaultOrderingFieldName || 'id'
      }
      loadData(initialParams)
    }

    const columns = Array.isArray(props.columns) ? props.columns : props.columns?.value || []
    selectedColumns.value = columns.filter((col) => !props.hiddenByDefault?.includes(col.field))

    loadLastModifiedToggleState()
  })

  // Watchers
  watch(
    () => props.columns,
    (newColumns) => {
      const columns = Array.isArray(newColumns) ? newColumns : newColumns?.value || []
      selectedColumns.value = columns
    },
    { deep: true }
  )

  watch(data, (currentState) => {
    const hasData = currentState?.length > 0
    emit('on-load-data', !!hasData)
  })

  return {
    // Reactive variables
    isLoading,
    data,
    selectedColumns,
    selectedId,
    dataTableRef,
    columnSelectorPanel,
    menuRef,
    filters,
    filtersDynamically,
    totalRecords,
    firstItemIndex,
    itemsByPage,
    minimumOfItemsPerPage,
    sortFieldValue,
    sortOrderValue,
    lastModifiedToggled,
    expandedGroups,
    selectedItems,
    isAllSelected,

    // Computed properties
    isRenderActions,
    isRenderOneOption,
    hasExportToCsvMapper,
    filterBy,
    getRowClass,

    // Functions
    loadData,
    reload,
    navigateToAddPage,
    editItemSelected,
    actionOptions,
    executeCommand,
    optionsOneAction,
    toggleActionsMenu,
    setMenuRefForRow,
    toggleColumnSelector,
    changeNumberOfLinesPerPage,
    updateDataTablePagination,
    fetchOnSort,
    sortByLastModified,
    fetchOnSearch,
    handleSearchValue,
    toggleLastModifiedDisplay,
    exportFunctionMapper,
    handleExportTableDataToCSV,
    extractFieldValue,
    getObjectPath,
    moveItem,
    onRowReorder,
    toggleRowSelection,
    toggleSelectAll,
    toggleGroup,
    stateClassRules
  }
}
