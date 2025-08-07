<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import Button from 'primevue/button'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Tag from 'primevue/tag'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import Skeleton from 'primevue/skeleton'
  import Menu from 'primevue/menu'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'

  import { useDialog } from 'primevue/usedialog'

  import { useEdgeSQLStore } from '@/stores/edge-sql'
  import { edgeSQLService } from '@/services/v2'
  import QueryHistory from './components/QueryHistory.vue'
  import DeleteDialog from '@/templates/list-table-block/dialog/delete-dialog.vue'
  import RowFormDrawer from './components/RowFormDrawer.vue'
  import InfoDrawerBlock from '@templates/info-drawer-block'
  import InfoSection from '@templates/info-drawer-block/info-section'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { QUICK_TEMPLATES, SQLITE_QUERIES } from './constants/queries'
  import { TableActionManager } from './utils/table-actions'
  import { useAccountStore } from '@/stores/account'

  defineOptions({ name: 'edge-sql-database-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const dialog = useDialog()
  const sqlStore = useEdgeSQLStore()
  const accountStore = useAccountStore()

  const documentationService = () => {
    window.open('https://www.azion.com/en/documentation/products/edge-sql/', '_blank')
  }

  const databaseId = computed(() => route.params.id)
  const databaseName = computed(() => {
    const name = sqlStore.currentDatabase?.name
    if (name && typeof name === 'object' && name.text !== undefined) {
      return name.text || name.content || null
    }
    return name || null
  })
  const sqlQuery = ref('SELECT 1 as test_column;')
  const isExecutingQuery = ref(false)
  const isLoadingTables = ref(false)
  const queryResults = ref([])
  const executionTime = ref(0)
  const affectedRows = ref(0)

  const tablesTree = ref([])
  const selectedTableSchema = ref(null)
  const selectedTableDefinition = ref('')
  const isLoadingSchema = ref(false)
  const isLoadingDefinition = ref(false)
  const isEditorCollapsed = ref(true)
  const isTemplatesCollapsed = ref(false)
  const selectedTableName = ref(null)

  const activeTabIndex = ref(1)
  const tableMenuRef = ref()
  const selectedTable = ref(null)
  const selectedRows = ref([])

  const rowsPerPage = ref(6)
  const currentPage = ref(0)
  const onPageChange = (event) => {
    currentPage.value = event.page
    rowsPerPage.value = event.rows
  }
  const loadDatabaseInfo = async () => {
    try {
      const result = await edgeSQLService.getDatabase(databaseId.value)

      if (result.statusCode === 200) {
        const database = result.body

        if (database.status === 'creating') {
          toast.add({
            severity: 'warn',
            summary: 'Database Creating',
            detail:
              'This database is still being created. You will be redirected to monitor the process.',
            life: 4000
          })
          router.push('/edge-sql')
          return
        }

        if (database.status !== 'created' && database.status !== 'ready') {
          toast.add({
            severity: 'error',
            summary: 'Database Unavailable',
            detail: 'This database is not available for queries at the moment.',
            life: 5000
          })
          router.push('/edge-sql')
          return
        }

        sqlStore.setCurrentDatabase(database)
      } else {
        throw new Error(result.error || 'Database not found')
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 5000
      })
      router.push('/edge-sql')
    }
  }

  const loadTables = async () => {
    if (!databaseId.value) return

    isLoadingTables.value = true
    try {
      const result = await edgeSQLService.getTables(databaseId.value)

      if (result.statusCode === 200) {
        sqlStore.setCurrentTables(result.body.tables)

        tablesTree.value = result.body.tables.map((table) => ({
          key: table.name,
          label: table.name,
          icon: 'pi pi-table',
          type: 'table',
          data: table,
          children: []
        }))
      }
    } catch (error) {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Error loading tables: ' + error.message,
        life: 3000
      })
    } finally {
      isLoadingTables.value = false
    }
  }

  const executeQuery = async (showToast = true) => {
    if (!sqlQuery.value.trim()) {
      if (showToast) {
        toast.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Enter a query to execute',
          life: 3000
        })
      }
      return
    }

    if (!databaseId.value) {
      if (showToast) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Database not loaded. Please reload the page.',
          life: 5000
        })
      }
      return
    }

    isExecutingQuery.value = true
    const startTime = Date.now()

    try {
      const isSelectQuery = sqlQuery.value.trim().toLowerCase().startsWith('select')

      const result = isSelectQuery
        ? await edgeSQLService.queryDatabase(databaseId.value, {
            statement: sqlQuery.value,
            parameters: []
          })
        : await edgeSQLService.executeDatabase(databaseId.value, {
            statements: [sqlQuery.value]
          })

      executionTime.value = Date.now() - startTime

      if (result.statusCode === 200) {
        queryResults.value = result.body.results || []
        affectedRows.value = result.body.affectedRows || 0

        selectedRows.value = []
        rowFormDrawerVisible.value = false
        isEditingRow.value = false
        editingRowData.value = {}
        editingRowIndex.value = -1

        currentPage.value = 0

        sqlStore.addQueryResult({
          query: sqlQuery.value,
          results: result.body.results,
          timestamp: new Date(),
          executionTime: executionTime.value,
          type: isSelectQuery ? 'query' : 'execute'
        })

        activeTabIndex.value = 0

        if (showToast) {
          const stats = getQueryStats(queryResults.value)
          const apiDuration = stats?.duration || executionTime.value

          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Query executed in ${apiDuration}ms`,
            life: 3000
          })
        }

        if (
          !isSelectQuery &&
          (sqlQuery.value.toLowerCase().includes('create table') ||
            sqlQuery.value.toLowerCase().includes('drop table') ||
            sqlQuery.value.toLowerCase().includes('alter table'))
        ) {
          await loadTables()
        }
      } else {
        throw new Error(result.error || 'Error executing query')
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred'
      toast.add({
        severity: 'error',
        summary: 'Query Error',
        detail: errorMessage,
        life: 6000
      })
    } finally {
      isExecutingQuery.value = false
    }
  }

  const quickTemplates = computed(() => {
    return QUICK_TEMPLATES.map((template) => ({
      ...template,
      icon: getTemplateIcon(template.name)
    }))
  })

  const getTemplateIcon = (templateName) => {
    const icons = {
      'Create Table': 'pi pi-plus',
      'Insert Data': 'pi pi-pencil',
      'Select All': 'pi pi-search',
      'Count Records': 'pi pi-calculator',
      'Update Record': 'pi pi-sync',
      'Delete Record': 'pi pi-trash',
      'Create Index': 'pi pi-bookmark',
      'Drop Table': 'pi pi-times',
      'Alter Table': 'pi pi-wrench',
      'Vector Table': 'pi pi-sitemap',
      'Insert Vectors': 'pi pi-share-alt',
      'Vector Search': 'pi pi-compass',
      'Create Vector Index': 'pi pi-objects-column',
      'Vector Top K Query': 'pi pi-chart-line'
    }
    return icons[templateName] || 'pi pi-code'
  }

  const useTemplate = (template) => {
    sqlQuery.value = template.query
    activeTabIndex.value = 0

    selectedTableName.value = null
    sqlStore.setSelectedTable(null)

    if (isEditorCollapsed.value) {
      isEditorCollapsed.value = false
    }
  }

  const rerunQuery = async (query) => {
    sqlQuery.value = query
    activeTabIndex.value = 0

    if (isEditorCollapsed.value) {
      isEditorCollapsed.value = false
    }

    await executeQuery()
  }

  const clearHistory = () => {
    toast.add({
      severity: 'info',
      summary: 'History Cleared',
      detail: 'Query history has been cleared successfully',
      life: 2000
    })
  }

  const selectTable = async (node) => {
    const tableName = node.key || node.name
    selectedTableName.value = tableName
    sqlStore.setSelectedTable({ name: tableName })
    sqlQuery.value = SQLITE_QUERIES.SELECT_ALL(tableName)

    isLoadingSchema.value = true

    await loadTableSchema(tableName)

    activeTabIndex.value = 0
    await executeQuery(false)
  }

  const toggleTemplates = () => {
    isTemplatesCollapsed.value = !isTemplatesCollapsed.value
  }

  const loadTableSchema = async (tableName) => {
    isLoadingSchema.value = true
    try {
      const result = await edgeSQLService.queryDatabase(databaseId.value, {
        statement: SQLITE_QUERIES.TABLE_INFO(tableName),
        parameters: []
      })

      if (result.statusCode === 200 && result.body.results?.length > 0) {
        selectedTableSchema.value = {
          name: tableName,
          columns: result.body.results[0].rows || []
        }
      }
      // eslint-disable-next-line no-empty
    } catch (error) {
    } finally {
      isLoadingSchema.value = false
    }
  }

  const loadTableDefinition = async (tableName) => {
    isLoadingDefinition.value = true
    selectedTableDefinition.value = ''
    try {
      const result = await edgeSQLService.queryDatabase(databaseId.value, {
        statement: SQLITE_QUERIES.TABLE_DEFINITION(tableName),
        parameters: []
      })

      if (
        result.statusCode === 200 &&
        result.body.results?.length > 0 &&
        result.body.results[0].rows?.length > 0
      ) {
        selectedTableDefinition.value =
          result.body.results[0].rows[0][0] || 'Table definition not found'
      } else {
        selectedTableDefinition.value = 'Table definition not found'
      }
    } catch (error) {
      selectedTableDefinition.value = `Error loading table definition: ${error.message}`
    } finally {
      isLoadingDefinition.value = false
    }
  }

  const copyDefinition = () => {
    if (!selectedTableDefinition.value) return

    navigator.clipboard.writeText(selectedTableDefinition.value).then(() => {
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Table definition copied to clipboard',
        life: 2000
      })
    })
  }

  const monacoTheme = computed(() => {
    return accountStore.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const sqlMonacoOptions = {
    readOnly: true,
    minimap: { enabled: false },
    tabSize: 2,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    folding: false,
    glyphMargin: false,
    lineDecorationsWidth: 6,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none',
    padding: { top: 10, bottom: 10 },
    wordWrap: 'on',
    contextmenu: false,
    selectOnLineNumbers: false,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    rulers: [],
    bracketPairColorization: { enabled: false },
    matchBrackets: 'never',
    renderIndentGuides: false,
    guides: {
      indentation: false,
      bracketPairs: false,
      bracketPairsHorizontal: false,
      highlightActiveIndentation: false
    },
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden'
    }
  }

  const showTableMenu = (event, table) => {
    if (selectedTable.value?.key === table.key) {
      tableMenuRef.value.toggle(event)
      return
    }

    if (tableMenuRef.value) {
      tableMenuRef.value.hide()
    }

    selectedTable.value = table

    nextTick(() => {
      tableMenuRef.value.show(event)
    })
  }

  const drawerVisible = ref(false)
  const definitionDrawerVisible = ref(false)
  const rowFormDrawerVisible = ref(false)
  const isEditingRow = ref(false)
  const editingRowData = ref({})
  const editingRowIndex = ref(-1)

  const copyTableDefinition = async () => {
    if (!selectedTableDefinition.value) return

    try {
      if (!selectedTableDefinition.value) {
        await loadTableDefinition(selectedTableSchema.value.name)
      }

      await navigator.clipboard.writeText(selectedTableDefinition.value || '')
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Table definition copied to clipboard',
        life: 2000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy table definition',
        life: 3000
      })
    }
  }

  const deleteTableService = async (tableName) => {
    try {
      const result = await edgeSQLService.executeDatabase(databaseId.value, {
        statements: [`DROP TABLE ${tableName};`]
      })

      if (result.statusCode === 200) {
        await loadTables()

        if (selectedTableName.value === tableName) {
          selectedTableName.value = null
          sqlStore.setSelectedTable(null)
          queryResults.value = []
        }
        return `Table "${tableName}" deleted successfully`
      } else {
        throw new Error(result.error || 'Failed to delete table')
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  const openDeleteTableDialog = (tableName) => {
    dialog.open(DeleteDialog, {
      data: {
        title: 'table',
        selectedID: tableName,
        selectedItemData: { name: tableName },
        deleteService: () => deleteTableService(tableName),
        deleteConfirmationText: tableName,
        entityDeleteMessage: `The table "${tableName}" will be permanently deleted along with all its data. This action cannot be undone.`,
        onSuccess: () => {}
      }
    })
  }

  const tableActionManager = new TableActionManager(
    executeQuery,
    {
      showTableInfo: (tableName) => {
        isLoadingSchema.value = true
        drawerVisible.value = true
        loadTableSchema(tableName)
      },
      showDefinition: (tableName) => {
        isLoadingDefinition.value = true
        definitionDrawerVisible.value = true
        loadTableDefinition(tableName)
      }
    },
    activeTabIndex,
    isEditorCollapsed,
    sqlQuery,
    openDeleteTableDialog
  )

  const tableMenuItems = computed(() => {
    if (!selectedTable.value) return []
    return tableActionManager.generateMenuItems(selectedTable.value.key)
  })

  const formatResultColumns = (result) => {
    return (
      result.columns?.map((col) => ({
        field: col,
        header: col
      })) || []
    )
  }

  const isPrimaryKey = (columnName) => {
    if (!selectedTableSchema.value?.columns) return false
    const columnInfo = selectedTableSchema.value.columns.find((col) => col[1] === columnName)
    return columnInfo ? columnInfo[5] === 1 : false
  }

  const formatResultData = (result) => {
    if (!result.rows || !result.columns) return []

    return result.rows.map((row, rowIndex) => {
      const obj = { _rowId: rowIndex, _originalRow: row }
      result.columns.forEach((col, index) => {
        const value = row[index]
        obj[col] = value
      })
      return obj
    })
  }

  const hasResultError = (result) => {
    if (result?.errors && Array.isArray(result.errors) && result.errors.length > 0) {
      return true
    }

    if (result?.error && typeof result.error === 'string') {
      return true
    }

    return false
  }

  const getResultError = (result) => {
    if (!hasResultError(result)) return null

    if (result?.errors && Array.isArray(result.errors) && result.errors.length > 0) {
      const error = result.errors[0]
      return error.detail || error.title || 'Unknown error occurred'
    }

    if (result?.error && typeof result.error === 'string') {
      return result.error
    }

    return 'Unknown error occurred'
  }

  const getQueryStats = (results) => {
    if (!Array.isArray(results) || results.length === 0) return null

    const stats = results.reduce(
      (acc, result) => {
        return {
          duration: Math.max(acc.duration, result.query_duration_ms || 0),
          rowsRead: acc.rowsRead + (result.rows_read || 0),
          rowsWritten: acc.rowsWritten + (result.rows_written || 0),
          totalRows: acc.totalRows + (result.rows?.length || 0)
        }
      },
      { duration: 0, rowsRead: 0, rowsWritten: 0, totalRows: 0 }
    )

    return stats
  }

  const formatCellValue = (value) => {
    if (value === null) return 'NULL'
    if (value === undefined) return 'UNDEFINED'
    if (value === '') return '(empty)'

    if (value !== null && value !== undefined && typeof value === 'object') {
      if (value.type && value.data) {
        return `${value.type}(${value.data.length || 'unknown size'})`
      } else if (Array.isArray(value)) {
        if (value.length <= 5) {
          return `[${value.join(', ')}]`
        } else {
          return `Array[${value.length}] [${value.slice(0, 3).join(', ')}, ...]`
        }
      } else if (value.constructor === Uint8Array || value.constructor === ArrayBuffer) {
        return `BLOB(${value.byteLength || value.length} bytes)`
      } else {
        const keys = Object.keys(value)
        if (keys.length === 1) {
          const firstKey = keys[0]
          const firstValue = value[firstKey]

          if (typeof firstValue === 'string' || typeof firstValue === 'number') {
            if (typeof firstValue === 'string' && firstValue.length > 50) {
              return `"${firstValue.substring(0, 47)}..."`
            } else {
              return String(firstValue)
            }
          }
        }

        try {
          const jsonStr = JSON.stringify(value)
          if (jsonStr.length <= 100) {
            return jsonStr
          } else {
            return `${jsonStr.substring(0, 97)}...`
          }
        } catch {
          return `Object{${keys.length} keys}`
        }
      }
    }

    return value
  }

  const deleteRowsService = async (selectedID, selectedItemData) => {
    try {
      if (!selectedTableName.value || !selectedTableSchema.value?.columns) {
        throw new Error('Table information not available')
      }

      const tableName = selectedTableName.value
      const columnInfo = selectedTableSchema.value.columns

      const rowsToDelete = Array.isArray(selectedItemData) ? selectedItemData : [selectedItemData]

      const deleteQueries = rowsToDelete.map((rowData) => {
        const whereConditions = []

        const primaryKeys = columnInfo.filter((col) => col[5] === 1)

        let usePrimaryKeys = false
        if (primaryKeys.length > 0) {
          primaryKeys.forEach((col) => {
            const columnName = col[1]
            const columnType = col[2]
            const value = rowData[columnName]

            if (value !== undefined && value !== null && value !== '') {
              const escapedValue = escapeValue(value, columnType)
              whereConditions.push(`${columnName} = ${escapedValue}`)
              usePrimaryKeys = true
            }
          })
        }

        if (!usePrimaryKeys) {
          Object.keys(rowData).forEach((columnName) => {
            if (columnName !== '_rowId') {
              const value = rowData[columnName]

              if (value !== undefined && value !== null && value !== '') {
                const columnType = getColumnTypeFromInfo(columnName, columnInfo)
                const escapedValue = escapeValue(value, columnType)
                whereConditions.push(`${columnName} = ${escapedValue}`)
              }
            }
          })
        }

        if (whereConditions.length === 0) {
          throw new Error('Cannot delete row: no valid conditions found')
        }

        return `DELETE FROM ${tableName} WHERE ${whereConditions.join(' AND ')};`
      })

      const result = await edgeSQLService.executeDatabase(databaseId.value, {
        statements: deleteQueries
      })

      if (result.statusCode === 200) {
        const successMessage = `Successfully deleted ${rowsToDelete.length} row(s)`
        return successMessage
      } else {
        throw new Error(result.error || 'Failed to delete rows')
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  const escapeValue = (value, columnType) => {
    if (value === null || value === undefined || value === '') {
      return 'NULL'
    }

    const strValue = value.toString().trim()

    if (
      columnType &&
      (columnType.toUpperCase().includes('INTEGER') ||
        columnType.toUpperCase().includes('REAL') ||
        columnType.toUpperCase().includes('NUMERIC'))
    ) {
      if (!isNaN(strValue) && strValue !== '') {
        return strValue
      }
    }

    return `'${strValue.replace(/'/g, "''")}'`
  }

  const getColumnTypeFromInfo = (columnName, columnInfo) => {
    const info = columnInfo.find((col) => col[1] === columnName)
    return info ? info[2] : 'TEXT'
  }

  const deleteSelectedRows = () => {
    if (selectedRows.value.length === 0) return

    const selectedCount = selectedRows.value.length

    const selectedRowsData = selectedRows.value.map((row) => {
      const cleanRow = { ...row }
      delete cleanRow._rowId
      return cleanRow
    })

    dialog.open(DeleteDialog, {
      data: {
        title: `row${selectedCount > 1 ? 's' : ''}`,
        selectedID: selectedCount,
        selectedItemData: selectedRowsData,
        deleteService: deleteRowsService,
        deleteConfirmationText: 'DELETE',
        entityDeleteMessage: `The selected ${selectedCount} row${
          selectedCount > 1 ? 's' : ''
        } will be permanently deleted from the table. This action cannot be undone.`,
        onSuccess: async () => {
          selectedRows.value = []
          if (selectedTableName.value && sqlQuery.value) {
            await executeQuery(false)
          }
        }
      }
    })
  }

  const exportSelectedRows = () => {
    if (selectedRows.value.length === 0) return

    const exportData = selectedRows.value.map((row) => {
      const cleanRow = { ...row }
      delete cleanRow._rowId
      return cleanRow
    })

    const csv = convertToCSV(exportData)
    downloadCSV(csv, `edge-sql-selected-rows-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportAllResults = () => {
    if (queryResults.value.length === 0) return

    const result = queryResults.value[0]
    const exportData = formatResultData(result).map((row) => {
      const cleanRow = { ...row }
      delete cleanRow._rowId
      return cleanRow
    })

    const csv = convertToCSV(exportData)
    downloadCSV(csv, `edge-sql-all-results-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = filename
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data) => {
    if (!data.length) return ''

    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        })
        .join(',')
    )

    return [csvHeaders, ...csvRows].join('\n')
  }

  const clearRowFormState = () => {
    editingRowData.value = {}
    editingRowIndex.value = -1
    isEditingRow.value = false
    focusedField.value = ''
  }

  const openInsertRowDrawer = () => {
    if (queryResults.value.length === 0) return

    clearRowFormState()
    rowFormDrawerVisible.value = true
  }

  const focusedField = ref('')

  const openEditRowDrawer = (rowData, rowIndex, fieldToFocus = '') => {
    if (queryResults.value.length === 0) return

    const result = queryResults.value[0]
    if (!result.columns) return

    clearRowFormState()

    isEditingRow.value = true
    editingRowData.value = {}

    result.columns.forEach((col) => {
      editingRowData.value[col] = rowData[col] || ''
    })

    focusedField.value = fieldToFocus

    editingRowIndex.value = rowIndex
    rowFormDrawerVisible.value = true
  }

  const handleRowFormSuccess = async () => {
    selectedRows.value = []
    editingRowData.value = {}
    editingRowIndex.value = -1
    isEditingRow.value = false
    focusedField.value = ''
    rowFormDrawerVisible.value = false

    if (selectedTableName.value && sqlQuery.value) {
      await executeQuery(false)
    }
  }

  const clickTimeout = ref(null)

  const copyToClipboard = async (rowData, fieldName) => {
    try {
      const originalRow = rowData._originalRow
      const result = queryResults.value[0]

      if (originalRow && result?.columns) {
        const fieldIndex = result.columns.indexOf(fieldName)
        const originalValue = fieldIndex >= 0 ? originalRow[fieldIndex] : rowData[fieldName]

        let textToCopy = ''
        if (originalValue === null || originalValue === undefined) {
          textToCopy = 'NULL'
        } else if (typeof originalValue === 'object') {
          try {
            textToCopy = JSON.stringify(originalValue, null, 2)
          } catch {
            textToCopy = String(originalValue)
          }
        } else {
          textToCopy = String(originalValue)
        }

        await navigator.clipboard.writeText(textToCopy)

        toast.add({
          severity: 'success',
          summary: 'Copied',
          detail: `${fieldName}: value copied to clipboard`,
          life: 2000
        })
      } else {
        throw new Error('Could not access original data')
      }
    } catch (error) {
      toast.add({
        severity: 'warn',
        summary: 'Copy failed',
        detail: 'Could not copy to clipboard',
        life: 2000
      })
    }
  }

  const handleCellClick = (rowData, fieldName) => {
    if (clickTimeout.value) {
      clearTimeout(clickTimeout.value)
    }

    clickTimeout.value = setTimeout(() => {
      copyToClipboard(rowData, fieldName)
      clickTimeout.value = null
    }, 250)
  }

  const handleCellDoubleClick = (data, index, field) => {
    if (clickTimeout.value) {
      clearTimeout(clickTimeout.value)
      clickTimeout.value = null
    }

    openEditRowDrawer(data, index, field)
  }

  // Wrapper functions para resolver conflito com o formatter
  const handleCellClickWithStopPropagation = (data, field, event) => {
    handleCellClick(data, field)
    event.stopPropagation()
  }

  const handleCellDoubleClickWithStopPropagation = (data, index, field, event) => {
    handleCellDoubleClick(data, index, field)
    event.stopPropagation()
  }

  const monacoOptions = {
    minimap: { enabled: false },
    tabSize: 2,
    formatOnPaste: true,
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineNumbers: 'on',
    folding: false,
    glyphMargin: false,
    lineDecorationsWidth: 6,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none',
    padding: { top: 10, bottom: 10 }
  }

  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      if (!isExecutingQuery.value && sqlQuery.value.trim()) {
        executeQuery()
      }
    }
  }

  onMounted(async () => {
    await loadDatabaseInfo()
    await loadTables()

    document.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  watch(databaseId, async (newId) => {
    if (newId) {
      await loadDatabaseInfo()
      await loadTables()
    }
  })

  watch(databaseId, async (newId) => {
    if (newId) {
      await loadTables()
    }
  })

  watch(rowFormDrawerVisible, (newVisible) => {
    if (!newVisible) {
      setTimeout(() => {
        clearRowFormState()
      }, 300)
    }
  })
</script>

<template>
  <div>
    <ContentBlock data-testid="edge-sql-database-content-block">
      <template #heading>
        <PageHeadingBlock
          :pageTitle="databaseName || databaseId"
          data-testid="edge-sql-database-heading"
        >
          <template #actions>
            <div class="flex gap-2">
              <Button
                label="Back to Databases"
                icon="pi pi-arrow-left"
                class="p-button-outlined"
                @click="router.push('/edge-sql')"
              />
            </div>
          </template>
        </PageHeadingBlock>
      </template>
      <template #content>
        <div class="sql-interface h-full overflow-hidden">
          <div class="flex h-full gap-3 p-3">
            <div
              class="database-sidebar flex-shrink-0 bg-surface-0 border-round-lg border-1 surface-border"
              style="width: 320px"
            >
              <div class="h-full flex flex-column overflow-hidden">
                <div class="p-4 flex-grow-1 overflow-hidden flex flex-column">
                  <h3
                    class="text-sm font-semibold mb-3 text-color flex items-center gap-2 flex-shrink-0"
                  >
                    <i class="pi pi-database text-primary"></i>
                    Tables
                  </h3>

                  <div
                    v-if="isLoadingTables"
                    class="flex-grow-1 overflow-y-auto pr-1"
                  >
                    <div
                      v-for="i in 6"
                      :key="`skeleton-${i}`"
                      class="flex items-center justify-between px-3 py-2 border-round min-h-10"
                    >
                      <div class="flex items-center gap-3">
                        <Skeleton class="w-5 h-5 border-round flex-shrink-0" />
                        <Skeleton
                          class="h-4"
                          style="width: 120px"
                        />
                      </div>
                      <div class="flex-shrink-0">
                        <Skeleton class="w-8 h-8 border-round" />
                      </div>
                    </div>
                  </div>

                  <div
                    v-else-if="tablesTree.length === 0"
                    class="flex-grow-1"
                  >
                    <EmptyResultsBlock
                      title="No tables found"
                      description="Use CREATE TABLE statements to create your first table"
                      :documentationService="documentationService"
                      :inTabs="true"
                      :noBorder="true"
                    >
                      <template #illustration>
                        <i class="pi pi-database text-4xl text-primary opacity-50"></i>
                      </template>
                    </EmptyResultsBlock>
                  </div>

                  <div
                    v-else
                    class="flex-grow-1 overflow-y-auto pr-1"
                  >
                    <div
                      v-for="table in tablesTree"
                      :key="table.key"
                      class="group flex items-center justify-between px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 border-round cursor-pointer transition-all duration-200 min-h-10"
                      :class="{ 'surface-200': selectedTableName === table.key }"
                      @click="selectTable(table)"
                    >
                      <div class="flex items-center gap-3 text-left">
                        <i class="pi pi-table text-primary text-sm flex-shrink-0"></i>
                        <span class="text-sm font-medium text-color">{{ table.label }}</span>
                      </div>
                      <div class="flex-shrink-0">
                        <Button
                          icon="pi pi-ellipsis-h"
                          size="small"
                          outlined
                          v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
                          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer table-button"
                          @click.stop="showTableMenu($event, table)"
                          aria-haspopup="true"
                          aria-controls="table_menu"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="flex-shrink-0 border-top-1 surface-border templates-section"
                  :class="{ 'p-4': !isTemplatesCollapsed, 'px-4 py-3': isTemplatesCollapsed }"
                >
                  <div
                    class="flex items-center justify-between cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors p-2 -m-2 border-round"
                    :class="{ 'mb-3': !isTemplatesCollapsed }"
                    @click="toggleTemplates"
                  >
                    <h3 class="text-sm font-semibold text-color flex items-center gap-2">
                      <i class="pi pi-bolt text-primary text-lg"></i>
                      Quick Templates
                    </h3>
                    <i
                      :class="isTemplatesCollapsed ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                      class="text-color-secondary hover:text-primary text-sm"
                    />
                  </div>
                  <div
                    v-show="!isTemplatesCollapsed"
                    class="templates-content"
                  >
                    <div
                      class="flex flex-column gap-1 overflow-y-auto"
                      style="max-height: 350px"
                    >
                      <div
                        v-for="template in quickTemplates"
                        :key="template.name"
                        class="group flex items-center gap-3 px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 border-round cursor-pointer transition-colors duration-200 min-h-10"
                        @click="useTemplate(template)"
                      >
                        <i :class="template.icon + ' text-primary text-sm flex-shrink-0'"></i>
                        <span class="text-sm font-medium text-color">{{ template.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="h-full flex flex-column gap-2 overflow-hidden">
                <div class="flex-shrink-0">
                  <Accordion :activeIndex="isEditorCollapsed ? null : 0">
                    <AccordionTab>
                      <template #header>
                        <div class="flex items-center gap-2">
                          <i class="pi pi-code text-primary"></i>
                          <span class="font-semibold text-color">Query Editor</span>
                        </div>
                      </template>

                      <div class="p-3 editor-content">
                        <div
                          class="sql-editor-container mb-3 border-1 surface-border overflow-hidden"
                          style="height: 180px"
                        >
                          <vue-monaco-editor
                            v-model:value="sqlQuery"
                            language="sql"
                            :theme="monacoTheme"
                            :options="{ ...monacoOptions, readOnly: isExecutingQuery }"
                            class="w-full h-full"
                          />
                        </div>

                        <div class="flex justify-content-between align-items-center">
                          <div class="flex align-items-center gap-3">
                            <Button
                              :label="isExecutingQuery ? 'Executing...' : 'Execute Query'"
                              :icon="isExecutingQuery ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
                              severity="primary"
                              :loading="isExecutingQuery"
                              @click="executeQuery"
                              :disabled="!sqlQuery.trim() || isExecutingQuery"
                              class="font-medium"
                              v-tooltip.top="'Execute Query (Ctrl+Enter)'"
                            />
                            <Button
                              label="Clear"
                              icon="pi pi-delete-left"
                              severity="secondary"
                              outlined
                              @click="sqlQuery = ''"
                              :disabled="isExecutingQuery"
                            />
                          </div>

                          <div
                            v-if="queryResults.length > 0"
                            class="flex align-items-center gap-3 text-sm text-color-secondary px-3 py-1 bg-surface-100 dark:bg-surface-700 border-round"
                          >
                            <div
                              v-if="getQueryStats(queryResults)?.duration"
                              class="flex align-items-center gap-1"
                            >
                              <i class="pi pi-clock text-xs"></i>
                              <span>{{ getQueryStats(queryResults).duration }}ms</span>
                            </div>

                            <div
                              v-else-if="executionTime > 0"
                              class="flex align-items-center gap-1"
                            >
                              <i class="pi pi-clock text-xs"></i>
                              <span>{{ executionTime }}ms</span>
                            </div>

                            <div
                              v-if="getQueryStats(queryResults)?.rowsRead !== undefined"
                              class="flex align-items-center gap-1"
                            >
                              <i class="pi pi-eye text-xs"></i>
                              <span>{{ getQueryStats(queryResults).rowsRead }} read</span>
                            </div>
                            <div
                              v-if="getQueryStats(queryResults)?.rowsWritten !== undefined"
                              class="flex align-items-center gap-1"
                            >
                              <i class="pi pi-pencil text-xs"></i>
                              <span>{{ getQueryStats(queryResults).rowsWritten }} written</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTab>
                  </Accordion>
                </div>

                <div class="flex-grow-1 bg-surface-0 border-round-lg border-1 surface-border">
                  <TabView
                    v-model:activeIndex="activeTabIndex"
                    class="results-tabs"
                  >
                    <TabPanel>
                      <template #header>
                        <div class="flex items-center gap-2">
                          <i class="pi pi-table"></i>
                          <span>Results</span>
                        </div>
                      </template>

                      <div
                        v-if="isExecutingQuery"
                        class="results-container"
                      >
                        <div class="mb-6">
                          <div
                            class="flex justify-content-between align-items-center mb-3 p-3 bg-surface-50 dark:bg-surface-800 border-round-lg"
                          >
                            <h4 class="text-base font-semibold text-color flex items-center gap-2">
                              <i class="pi pi-list text-primary"></i>
                              Query Results
                              <i class="pi pi-spin pi-spinner text-primary text-sm ml-2"></i>
                            </h4>
                          </div>

                          <div
                            class="border-round-lg shadow-sm border-1 surface-border overflow-hidden"
                          >
                            <DataTable
                              :value="Array(5)"
                              scrollable
                              scrollHeight="300px"
                              class="w-full"
                            >
                              <Column
                                v-for="col in 4"
                                :key="col"
                                :header="`Column ${col}`"
                                style="min-width: 120px"
                              >
                                <template #body>
                                  <Skeleton class="h-4" />
                                </template>
                              </Column>
                            </DataTable>
                          </div>
                        </div>
                      </div>

                      <div
                        v-else-if="queryResults.length === 0"
                        class="flex flex-col items-center justify-center text-center p-8"
                      >
                        <i class="pi pi-search text-6xl text-primary mb-4 opacity-50"></i>
                        <h3 class="text-xl font-medium text-color mb-2">Ready to execute</h3>
                        <p class="text-color-secondary">Execute a query to see the results here</p>
                      </div>

                      <div
                        v-else
                        class="results-container"
                      >
                        <div
                          v-for="(result, index) in queryResults"
                          :key="index"
                          class="mb-6"
                        >
                          <div
                            class="flex justify-content-between align-items-center mb-3 p-3 bg-surface-50 dark:bg-surface-800 border-round-lg"
                          >
                            <h4 class="text-base font-semibold text-color flex items-center gap-2">
                              <i class="pi pi-list text-primary"></i>
                              {{
                                queryResults.length > 1 ? `Result ${index + 1}` : 'Query Results'
                              }}
                              <Tag
                                v-if="result.rows?.length"
                                :value="`${result.rows.length} row${
                                  result.rows.length !== 1 ? 's' : ''
                                }`"
                                severity="success"
                                class="text-xs"
                              />
                            </h4>

                            <div class="flex items-center gap-2">
                              <Button
                                v-if="result.columns?.length > 0"
                                label="Insert"
                                icon="pi pi-plus"
                                severity="primary"
                                class="p-button-sm font-medium"
                                @click="openInsertRowDrawer"
                              />
                              <Button
                                icon="pi pi-file-export"
                                severity="secondary"
                                class="p-button-text p-button-sm !flex !items-center !justify-center w-8 h-8"
                                @click="exportAllResults"
                                :disabled="!result.rows?.length"
                                v-tooltip.top="'Export all results to CSV'"
                              />
                              <Button
                                icon="pi pi-download"
                                severity="secondary"
                                class="p-button-text p-button-sm !flex !items-center !justify-center w-8 h-8"
                                @click="exportSelectedRows"
                                :disabled="selectedRows.length === 0"
                                v-tooltip.top="`Export ${selectedRows.length || 0} selected row(s)`"
                              />
                              <Button
                                icon="pi pi-trash"
                                severity="danger"
                                class="p-button-text p-button-sm !flex !items-center !justify-center w-8 h-8"
                                @click="deleteSelectedRows"
                                :disabled="selectedRows.length === 0"
                                v-tooltip.top="`Delete ${selectedRows.length || 0} selected row(s)`"
                              />
                            </div>
                          </div>

                          <div
                            v-if="hasResultError(result)"
                            class="text-center p-6 bg-surface-50 dark:bg-surface-800 border-round-lg border-1 surface-border"
                          >
                            <i class="pi pi-exclamation-triangle text-3xl text-orange-500 mb-3"></i>
                            <p class="text-lg font-semibold text-color mb-2">Query Error</p>
                            <p
                              class="text-sm text-color-secondary font-mono bg-surface-100 dark:bg-surface-700 px-3 py-2 border-round inline-block"
                            >
                              {{ getResultError(result) }}
                            </p>
                          </div>

                          <div
                            v-else-if="result.columns?.length > 0"
                            class="border-round-lg shadow-sm border-1 surface-border overflow-hidden"
                          >
                            <DataTable
                              :value="formatResultData(result)"
                              v-model:selection="selectedRows"
                              dataKey="_rowId"
                              class="w-full"
                              selectionMode="checkbox"
                              :metaKeySelection="false"
                              :paginator="true"
                              :rows="rowsPerPage"
                              :rowsPerPageOptions="[10, 20, 50, 100]"
                              @page="onPageChange"
                              :pt="{
                                bodyRow: {
                                  class: ({ instance }) => {
                                    return instance.isSelected
                                      ? 'bg-primary-50 dark:bg-primary-900/20'
                                      : ''
                                  }
                                }
                              }"
                            >
                              <Column
                                selectionMode="multiple"
                                headerStyle="width: 2rem"
                                bodyStyle="width: 2rem"
                                :exportable="false"
                                :frozen="true"
                                alignFrozen="left"
                              ></Column>

                              <Column
                                v-for="(column, colIndex) in formatResultColumns(result)"
                                :key="column.field"
                                :field="column.field"
                                :style="{ maxWidth: '300px', minWidth: '120px' }"
                                :frozen="colIndex === 0 && isPrimaryKey(column.field)"
                                :alignFrozen="
                                  colIndex === 0 && isPrimaryKey(column.field) ? 'left' : undefined
                                "
                              >
                                <template #header>
                                  <span>{{ column.header }}</span>
                                </template>

                                <template #body="{ data, field, index }">
                                  <div
                                    class="table-cell-content cursor-pointer"
                                    @click="handleCellClickWithStopPropagation(data, field, $event)"
                                    @dblclick="
                                      handleCellDoubleClickWithStopPropagation(
                                        data,
                                        index,
                                        field,
                                        $event
                                      )
                                    "
                                    :title="`Click to copy • Double-click to edit`"
                                  >
                                    <span
                                      class="cell-value"
                                      :class="{
                                        'text-color-secondary italic':
                                          data[field] === null || data[field] === undefined
                                      }"
                                    >
                                      {{ formatCellValue(data[field]) }}
                                    </span>
                                  </div>
                                </template>
                              </Column>
                            </DataTable>

                            <div
                              v-if="!result.rows?.length"
                              class="text-center p-4 text-color-secondary bg-surface-50 dark:bg-surface-800"
                            >
                              <i class="pi pi-info-circle mr-2"></i>
                              No results found
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabPanel>

                    <TabPanel>
                      <template #header>
                        <div class="flex items-center gap-2">
                          <i class="pi pi-history"></i>
                          <span>History</span>
                        </div>
                      </template>

                      <QueryHistory
                        @rerun-query="rerunQuery"
                        @clear-history="clearHistory"
                      />
                    </TabPanel>
                  </TabView>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ContentBlock>

    <InfoDrawerBlock
      v-model:visible="drawerVisible"
      :title="selectedTableSchema ? `Table Info: ${selectedTableSchema.name}` : 'Table Information'"
    >
      <template #body>
        <div class="w-full flex flex-col gap-8 max-md:gap-6">
          <div
            v-if="isLoadingSchema"
            class="w-full"
          >
            <div class="flex flex-col gap-8 max-md:gap-6">
              <div
                class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
              >
                <div class="flex items-center gap-3 mb-4">
                  <Skeleton class="w-32 h-6" />
                  <Skeleton class="w-20 h-6 rounded-full" />
                </div>
                <div class="flex justify-content-between align-items-center w-full">
                  <Skeleton class="w-24 h-6 rounded-full" />
                  <Skeleton class="w-32 h-8 rounded" />
                </div>
              </div>

              <div
                class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
              >
                <Skeleton class="w-20 h-6 mb-4" />
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                  <div
                    v-for="i in 6"
                    :key="i"
                    class="p-4 border-round-md surface-border border-1"
                  >
                    <div class="flex flex-column gap-3">
                      <div class="flex align-items-center gap-2">
                        <Skeleton class="w-4 h-4" />
                        <Skeleton class="w-24 h-4" />
                      </div>
                      <Skeleton class="w-16 h-5 rounded" />
                      <div class="flex gap-1">
                        <Skeleton class="w-16 h-4 rounded-full" />
                        <Skeleton class="w-12 h-4 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="selectedTableSchema"
            class="w-full"
          >
            <InfoSection
              :title="selectedTableSchema.name"
              :loading="false"
              hideDivider
            >
              <template #body>
                <div class="flex justify-content-between align-items-center w-full">
                  <div class="flex align-items-center gap-2">
                    <Tag
                      icon="pi pi-table"
                      :value="`${selectedTableSchema.columns.length} columns`"
                      severity="info"
                    />
                  </div>
                  <Button
                    icon="pi pi-copy"
                    label="Copy Definition"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="copyTableDefinition"
                  />
                </div>
              </template>
            </InfoSection>

            <InfoSection
              title="Columns"
              :loading="false"
            >
              <template #body>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                  <div
                    v-for="(column, index) in selectedTableSchema.columns"
                    :key="index"
                    class="p-4 border-round-md surface-border border-1 hover:surface-100 dark:hover:surface-700 transition-colors"
                  >
                    <div class="flex flex-column gap-3">
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-bookmark text-primary text-sm"></i>
                        <span class="font-semibold text-color">{{ column[1] }}</span>
                      </div>

                      <div class="text-xs text-color-secondary">
                        <span
                          class="font-mono bg-surface-100 dark:bg-surface-700 px-2 py-1 border-round"
                        >
                          {{ column[2] }}
                        </span>
                      </div>

                      <div class="flex gap-1 flex-wrap">
                        <Tag
                          v-if="column[3]"
                          value="NOT NULL"
                          severity="warning"
                          class="text-xs"
                          style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                        />
                        <Tag
                          v-if="column[5]"
                          value="PRIMARY KEY"
                          severity="info"
                          class="text-xs"
                          style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                        />
                        <Tag
                          v-if="column[4]"
                          value="DEFAULT"
                          severity="secondary"
                          class="text-xs"
                          style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                          v-tooltip.top="`Default: ${column[4]}`"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </InfoSection>
          </div>

          <div
            v-else
            class="flex flex-col items-center justify-center p-8 text-center"
          >
            <i class="pi pi-table text-6xl text-primary mb-4 opacity-50"></i>
            <h4 class="text-lg font-medium text-color mb-2">Select a table</h4>
            <p class="text-color-secondary">
              Choose a table from the sidebar to view its definition
            </p>
          </div>
        </div>
      </template>
    </InfoDrawerBlock>

    <InfoDrawerBlock
      v-model:visible="definitionDrawerVisible"
      :title="selectedTable?.key ? `SQL Definition: ${selectedTable.key}` : 'SQL Definition'"
    >
      <template #body>
        <div class="w-full flex flex-col gap-8 max-md:gap-6">
          <div
            v-if="isLoadingDefinition"
            class="w-full"
          >
            <div class="flex flex-col gap-8 max-md:gap-6">
              <div
                class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
              >
                <div class="flex items-center gap-3 mb-4">
                  <Skeleton class="w-32 h-6" />
                </div>
                <div class="flex justify-content-between align-items-center w-full">
                  <Skeleton class="w-40 h-6 rounded-full" />
                  <Skeleton class="w-32 h-8 rounded" />
                </div>
              </div>

              <div
                class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
              >
                <Skeleton class="w-40 h-6 mb-4" />
                <div class="bg-surface-50 dark:bg-surface-800 border-round-lg p-4">
                  <div class="flex flex-col gap-2">
                    <Skeleton class="w-48 h-4" />
                    <Skeleton class="w-full h-4" />
                    <Skeleton class="w-56 h-4" />
                    <Skeleton class="w-40 h-4" />
                    <Skeleton class="w-64 h-4" />
                    <Skeleton class="w-32 h-4" />
                    <Skeleton class="w-24 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="selectedTableDefinition"
            class="w-full"
          >
            <InfoSection
              :title="selectedTable?.key || 'Table'"
              :loading="false"
              hideDivider
            >
              <template #body>
                <div class="flex justify-content-between align-items-center w-full">
                  <div class="flex align-items-center gap-2">
                    <Tag
                      icon="pi pi-code"
                      value="CREATE TABLE Statement"
                      severity="info"
                    />
                  </div>
                  <Button
                    icon="pi pi-copy"
                    label="Copy Statement"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="copyDefinition"
                  />
                </div>
              </template>
            </InfoSection>

            <InfoSection
              title="CREATE TABLE Statement"
              :loading="false"
            >
              <template #body>
                <div
                  v-if="selectedTableDefinition"
                  class="sql-definition-display border-round-lg border-1 surface-border overflow-hidden w-full bg-surface-ground"
                >
                  <div
                    class="sql-definition-header p-2 border-bottom-1 surface-border bg-surface-50 dark:bg-surface-800 flex justify-content-between align-items-center"
                  >
                    <span class="text-xs text-color-secondary font-mono">SQLite</span>
                    <Button
                      icon="pi pi-copy"
                      class="p-button-text p-button-sm text-color-secondary hover:text-primary"
                      @click="copyDefinition"
                      v-tooltip.top="'Copy SQL'"
                    />
                  </div>
                  <div
                    class="sql-monaco-container border-round-lg overflow-hidden"
                    style="height: 350px"
                  >
                    <vue-monaco-editor
                      :key="selectedTableDefinition"
                      :value="selectedTableDefinition"
                      language="sql"
                      :theme="monacoTheme"
                      :options="sqlMonacoOptions"
                      class="w-full h-full"
                    />
                  </div>
                </div>
                <div
                  v-else
                  class="flex items-center justify-center h-24 text-color-secondary"
                >
                  <i class="pi pi-spin pi-spinner mr-2"></i>
                  Loading definition...
                </div>
              </template>
            </InfoSection>
          </div>

          <div
            v-else
            class="flex flex-col items-center justify-center p-8 text-center"
          >
            <i class="pi pi-code text-6xl text-primary mb-4 opacity-50"></i>
            <h4 class="text-lg font-medium text-color mb-2">No definition loaded</h4>
            <p class="text-color-secondary">
              Select a table and click "View Definition" from the menu to view its CREATE TABLE
              statement
            </p>
          </div>
        </div>
      </template>
    </InfoDrawerBlock>

    <RowFormDrawer
      v-model:visible="rowFormDrawerVisible"
      :columns="queryResults[0]?.columns || []"
      :columnInfo="selectedTableSchema?.columns || []"
      :tableName="selectedTableName || ''"
      :initialData="editingRowData || {}"
      :isEditing="isEditingRow"
      :focusField="focusedField || ''"
      @onSuccess="handleRowFormSuccess"
    />

    <Menu
      ref="tableMenuRef"
      id="table_menu"
      :model="tableMenuItems"
      :popup="true"
      class="w-fit"
      :pt="{
        menuitem: ({ context }) => ({
          'data-testid': `table-menu-item-${context.item?.label
            ?.toLowerCase()
            .replace(/\s+/g, '-')}`
        })
      }"
    />
  </div>
</template>

<style scoped>
  .sql-interface {
    height: calc(100vh);

  }

  .database-sidebar {
    min-width: 320px;
    max-width: 320px;
  }

  :deep(.p-textarea) {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.4;
  }
  :deep(.p-button.justify-content-start) {
    text-align: left;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th) {
    max-width: 300px;
    min-width: 120px;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    max-width: 300px;
    min-width: 120px;
    overflow: hidden;
  }

  
  .table-cell-content {
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0.5rem;
    display: block;
    width: 100%;
  }

  .table-cell-content .cell-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    width: 100%;
  }

  :deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
    background-color: var(--primary-50) !important;
  }

  :deep(.p-datatable .p-datatable-tbody > tr.p-highlight > td) {
    background-color: var(--primary-50) !important;
  }

  :deep(.p-datatable-wrapper) {
    overflow-x: auto !important;
    max-width: 100%;
  }

  :deep(.p-datatable-wrapper::-webkit-scrollbar) {
    height: 8px;
  }

  :deep(.p-datatable-wrapper::-webkit-scrollbar-track) {
    background: var(--surface-100);
    border-radius: 4px;
  }

  :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) {
    background: var(--surface-300);
    border-radius: 4px;
  }

  :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover) {
    background: var(--surface-400);
  }

  :deep(.p-tree .p-treenode-content) {
    text-align: left !important;
  }

  :deep(.p-tree .p-treenode-label) {
    text-align: left !important;
  }


  :deep(.results-tabs .p-tabview-nav) {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--surface-border);
    padding: 0 1rem;
  }

  :deep(.results-tabs .p-tabview-nav-link) {
    padding: 0.75rem 1rem;
    margin-bottom: -1px;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: var(--text-color-secondary) !important;
    transition: all 0.2s ease;
    font-weight: 500;
    border-radius: 0;
  }

  :deep(.results-tabs .p-tabview-nav-link:hover) {
    background: transparent;
    color: var(--text-color) !important;
    border-bottom-color: var(--surface-300);
  }

  :deep(.results-tabs .p-tabview-nav-link.p-highlight) {
    color: var(--primary-color) !important;
    border-bottom-color: var(--primary-color);
    background: transparent;
    font-weight: 600;
  }

  :deep(.results-tabs .p-tabview-panels) {
    background: transparent;
    border: none;
    padding: 1rem;
  }

  .editor-collapsed {
    max-height: 56px !important;
    overflow: hidden;
  }

  .sql-definition-display {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  }
</style>
