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
  const expandedGroups = ref(props.expandedRowGroups || [])

  // Last Modified Popup state
  const showPopup = ref(false)
  const popupPosition = ref({ posX: 0, posY: 0 })
  const popupData = ref({ lastEditor: '', lastModified: '' })
  const hoverTimeout = ref(null)

  // Filters
  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })

  const appliedFilters = ref([])
  const filterPanel = ref(null)

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
      return true
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
      return false
    } finally {
      isLoading.value = false
      if (firstLoadData.value) {
        const hasData = data.value?.length > 0
        emit('on-load-data', !!hasData)
      }
      firstLoadData.value = false
      if (query.skipCache) {
        const event = {
          originalEvent: {
            page: 0,
            first: 0,
            rows: 10,
            pageCount: 39
          },
          first: 0,
          rows: 10,
          sortField: null,
          sortOrder: null,
          multiSortMeta: [],
          filters: {},
          pageCount: 39,
          page: 0,
          skipReload: true
        }
        const numberOfLinesPerPage = event.rows
        tableDefinitions.setNumberOfLinesPerPage(numberOfLinesPerPage)
        itemsByPage.value = numberOfLinesPerPage
        minimumOfItemsPerPage.value = numberOfLinesPerPage
        firstItemIndex.value = event.first
      }
    }
  }

  const reload = async (query = {}, listService = null) => {
    if (!savedOrdering.value && props.defaultOrderingFieldName) {
      savedOrdering.value = props.defaultOrderingFieldName
    }
    const hasActiveFilters = appliedFilters.value.length > 0 || query.hasFilter

    const commonParams = {
      page: 1,
      pageSize: itemsByPage.value,
      fields: props.apiFields || [],
      ordering: savedOrdering.value,
      skipCache: query.skipCache,
      ...query
    }

    if (hasActiveFilters) {
      commonParams.hasFilter = true
    }

    if (props.lazy) {
      commonParams.search = savedSearch.value
    }
    return await loadData(commonParams, listService)
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

  // Applied Filters Management
  const buildFilterParams = () => {
    const filterParams = {}
    appliedFilters.value.forEach((filter) => {
      let fieldName = filter.field

      if (fieldName === 'lastmodified') {
        fieldName = 'last_modified'
      }

      if (
        typeof filter.value === 'object' &&
        filter.value !== null &&
        filter.value.operator === 'range'
      ) {
        if (filter.value.value?.start) {
          const key = `${fieldName}__gte`
          filterParams[key] = filter.value.value.start
        }
        if (filter.value.value?.end) {
          const key = `${fieldName}__lte`
          filterParams[key] = filter.value.value.end
        }
      } else if (Array.isArray(filter.value)) {
        filterParams[fieldName] = filter.value.join(',')
      } else {
        filterParams[fieldName] = filter.value
      }
    })
    if (appliedFilters.value.length > 0) {
      filterParams.hasFilter = true
    }
    return filterParams
  }

  const toggleFilter = (event) => {
    if (filterPanel.value) {
      filterPanel.value.toggle(event)
    }
  }

  const handleApplyFilter = async (filterData) => {
    const hasValue =
      filterData.value !== null && filterData.value !== undefined && filterData.value !== ''

    if (filterData.label && hasValue) {
      const existingFilterIndex = appliedFilters.value.findIndex(
        (filter) => filter.field === filterData.field
      )

      const previousFilter =
        existingFilterIndex !== -1 ? { ...appliedFilters.value[existingFilterIndex] } : null
      const isNewFilter = existingFilterIndex === -1

      if (existingFilterIndex !== -1) {
        appliedFilters.value[existingFilterIndex] = {
          field: filterData.field,
          label: filterData.label,
          value: filterData.value,
          matchMode: filterData.label === 'name' ? 'contains' : 'is'
        }
      } else {
        appliedFilters.value.push({
          field: filterData.field,
          label: filterData.label,
          value: filterData.value,
          matchMode: filterData.label === 'name' ? 'contains' : 'is'
        })
      }

      const filterParams = buildFilterParams()

      firstItemIndex.value = 0

      const success = await reload(filterParams)

      if (!success) {
        if (isNewFilter) {
          appliedFilters.value = appliedFilters.value.filter(
            (filter) => filter.field !== filterData.field
          )
        } else if (previousFilter) {
          const currentIndex = appliedFilters.value.findIndex(
            (filter) => filter.field === filterData.field
          )
          if (currentIndex !== -1) {
            appliedFilters.value[currentIndex] = previousFilter
          }
        }
      }
    }
  }

  const handleUpdateFilter = async (updateData) => {
    const { index, field, label, value } = updateData

    if (index >= 0 && index < appliedFilters.value.length) {
      const previousFilter = { ...appliedFilters.value[index] }

      appliedFilters.value[index] = {
        field,
        label,
        value,
        matchMode: label === 'name' ? 'contains' : 'is'
      }

      const filterParams = buildFilterParams()
      firstItemIndex.value = 0

      const success = await reload(filterParams)

      if (!success) {
        appliedFilters.value[index] = previousFilter
      }
    }
  }

  const handleRemoveFilter = (fieldOrIndex) => {
    if (typeof fieldOrIndex === 'number') {
      const removedFilter = appliedFilters.value[fieldOrIndex]
      appliedFilters.value.splice(fieldOrIndex, 1)
      if (removedFilter && filters.value[removedFilter.field]) {
        delete filters.value[removedFilter.field]
      }
    } else {
      appliedFilters.value = appliedFilters.value.filter((filter) => filter.field !== fieldOrIndex)
      if (filters.value[fieldOrIndex]) {
        delete filters.value[fieldOrIndex]
      }
    }

    const filterParams = buildFilterParams()
    firstItemIndex.value = 0
    reload(filterParams)
  }

  // CSV Export
  const exportFunctionMapper = (rowData) => {
    if (!hasExportToCsvMapper.value) return
    const columnMapper = props.csvMapper(rowData)
    return getCsvCellContentFromRowData({ columnMapper, rowData })
  }

  // (moved below to allow using helpers)

  // Centralized JSON and XLSX Export
  const getVisibleFields = (columnsArg = null) => {
    const cols = Array.isArray(columnsArg) ? columnsArg : selectedColumns.value
    const normalized = Array.isArray(cols) ? cols : []
    return normalized
      .map((column) => (typeof column === 'string' ? { field: column, header: column } : column))
      .filter((column) => column?.field && column.field !== 'actions')
  }

  const generateExportFilename = (baseName, extension) => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const cleanBaseName = String(baseName || 'data').trim()
    return `${cleanBaseName} - ${year}-${month}-${day}.${extension}`
  }

  const getExportValue = (value) => {
    if (value === null || value === undefined) return ''
    if (Array.isArray(value)) {
      return value.map((item) => getExportValue(item)).join(', ')
    }
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toISOString()
      if (Object.prototype.hasOwnProperty.call(value, 'content')) return value.content
      if (Object.prototype.hasOwnProperty.call(value, 'name')) return value.name
      if (Object.prototype.hasOwnProperty.call(value, 'label')) return value.label
      if (Object.prototype.hasOwnProperty.call(value, 'text')) return value.text
      if (Object.prototype.hasOwnProperty.call(value, 'value')) return value.value
    }
    return value
  }

  const buildExportRows = (rowsArg = null, columnsArg = null) => {
    const rowsSource = Array.isArray(rowsArg) ? rowsArg : data.value
    const rows = Array.isArray(rowsSource) ? rowsSource : []
    const fields = getVisibleFields(columnsArg).map((column) => column.field)
    return rows.map((row) => {
      const out = {}
      for (const fieldName of fields) {
        out[fieldName] = getExportValue(row?.[fieldName])
      }
      return out
    })
  }

  const triggerDownload = (content, mime, filename) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const anchorEl = document.createElement('a')
    anchorEl.href = url
    anchorEl.download = filename
    document.body.appendChild(anchorEl)
    anchorEl.click()
    document.body.removeChild(anchorEl)
    URL.revokeObjectURL(url)
  }

  const toCsv = (rows, fields) => {
    const escapeCsv = (val) => {
      if (val == null) return ''
      const str = String(val)
      if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"'
      return str
    }
    const header = fields.map(escapeCsv).join(',')
    const body = rows
      .map((row) => fields.map((field) => escapeCsv(row?.[field])).join(','))
      .join('\n')
    return header + '\n' + body
  }

  const handleExportTableDataToCSV = (
    filenameBase = props.exportFileName ?? 'data',
    rowsArg = null,
    columnsArg = null
  ) => {
    const rows = buildExportRows(rowsArg, columnsArg)
    const fields = getVisibleFields(columnsArg).map((column) => column.field)
    const csv = toCsv(rows, fields)
    const name = generateExportFilename(filenameBase, 'csv')
    triggerDownload(csv, 'text/csv;charset=utf-8;', name)
  }

  const exportTableAsJSON = (
    filenameBase = props.exportFileName ?? 'data',
    rowsArg = null,
    columnsArg = null
  ) => {
    const rows = buildExportRows(rowsArg, columnsArg)
    const json = JSON.stringify(rows, null, 2)
    const name = generateExportFilename(filenameBase, 'json')
    triggerDownload(json, 'application/json;charset=utf-8;', name)
  }

  const exportTableAsXLSX = async (
    filenameBase = props.exportFileName ?? 'data',
    rowsArg = null,
    columnsArg = null
  ) => {
    const rows = buildExportRows(rowsArg, columnsArg)
    const fields = getVisibleFields(columnsArg).map((column) => column.field)

    const nonEmptyRows = rows.filter((row) =>
      fields.some((fieldName) => {
        const value = row?.[fieldName]
        return value !== null && value !== undefined && value !== ''
      })
    )

    const name = generateExportFilename(filenameBase, 'xlsx')
    try {
      const mod = await import('xlsx')
      const XLSX = mod.default ?? mod
      const headerRow = fields
      const dataRows = nonEmptyRows.map((row) => fields.map((fieldName) => row?.[fieldName]))
      const worksheetData = [headerRow, ...dataRows]
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)

      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
      const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      triggerDownload(blob, blob.type, name)
    } catch (err) {
      // Fallback to CSV via built-in exporter
      handleExportTableDataToCSV()
    }
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
    appliedFilters,
    filterPanel,
    totalRecords,
    firstItemIndex,
    itemsByPage,
    minimumOfItemsPerPage,
    sortFieldValue,
    sortOrderValue,
    expandedGroups,
    selectedItems,
    isAllSelected,
    showPopup,
    popupPosition,
    popupData,
    hoverTimeout,
    savedSearch,

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
    fetchOnSearch,
    handleSearchValue,
    toggleFilter,
    handleApplyFilter,
    handleUpdateFilter,
    handleRemoveFilter,
    exportFunctionMapper,
    handleExportTableDataToCSV,
    // alias for clarity
    exportTableAsCSV: handleExportTableDataToCSV,
    exportTableAsJSON,
    exportTableAsXLSX,
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
