<template>
  <div class="mt-6">
    <InlineMessage
      class="w-full mb-6"
      severity="info"
      icon="pi pi-info"
      v-if="areActionsDisabled"
    >
      Searches across multiple database tables are read-only. For security reasons, editing or
      deleting rows is not permitted in this context.
    </InlineMessage>

    <ListTableBlockWithRowEdit
      v-if="shouldShowTable"
      :columns="tableColumns"
      :data="formattedTableData"
      :isLoading="isExecutingQuery"
      :key="tableKey"
      :hasExportToCsv="true"
      :editingRows="editingRows"
      :frozenSize="'0.1rem'"
      :csvMapper="csvDataMapper"
      :exportFileName="csvFileName"
      :menuItems="rowMenuItems"
      :cleanEditingRows="shouldCleanEditingRows"
      :disabledRowActions="areActionsDisabled"
      @row-edit-save="handleRowSave"
      @row-edit-cancel="handleRowCancel"
    >
      <template #addButton>
        <Button
          label="Row"
          icon="pi pi-plus"
          severity="primary"
          class="p-button-sm font-medium"
          :disabled="isAddRowDisabled"
          @click="handleAddRow"
        />
      </template>
    </ListTableBlockWithRowEdit>

    <EmptyResultsBlock
      v-else
      title="Ready to execute"
      description="Execute a query to see the results here"
      :showLearnMoreButton="false"
    />
  </div>
</template>
<script setup>
  import { ref, watch, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'

  // Components
  import ListTableBlockWithRowEdit from '@/templates/list-table-block/with-row-edit'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Button from 'primevue/button'
  import InlineMessage from 'primevue/inlinemessage'

  // Services and composables
  import { edgeSQLService } from '@/services/v2'
  import { useEdgeSQL } from '../../composable/useEdgeSQL'
  import { SQLITE_QUERIES } from '../../constants'

  defineOptions({ name: 'ResultsBlock' })
  const emit = defineEmits(['execute-query'])

  const route = useRoute()
  const toast = useToast()

  // Composables
  const edgeSQL = useEdgeSQL()

  // Props
  const props = defineProps({
    queryResults: {
      type: Array,
      default: () => []
    },
    isExecutingQuery: {
      type: Boolean,
      default: false
    },
    tableName: {
      type: String,
      default: () => ''
    },
    currentQuery: {
      type: String,
      default: () => ''
    }
  })

  // Reactive state
  const shouldCleanEditingRows = ref(false)
  const editingRows = ref([])
  const isAddNewRowDisabled = ref(false)
  const queryResults = ref(props.queryResults)
  const tableSchema = ref(null)

  // Computed properties
  const databaseId = computed(() => route.params.id)

  const tableColumns = computed(() => {
    const firstResult = queryResults.value?.[0]
    if (!firstResult?.columns?.length) return []

    return firstResult.columns.map((column) => ({
      field: column,
      header: column
    }))
  })

  const hasQueryResults = computed(() => {
    return queryResults.value?.length > 0 && queryResults.value[0]?.rows?.length > 0
  })

  const shouldShowTable = computed(() => {
    return hasQueryResults.value
  })

  const handleDeleteRow = async (row) => {
    const filteredRowData = filterValidSchemaKeys(row, tableSchema.value.rows)
    const deleteQuery = SQLITE_QUERIES.DELETE_DATA(
      props.tableName,
      filteredRowData,
      tableSchema.value.rows
    )
    await edgeSQL.executeQuery([deleteQuery])
    refreshQueryResults()
  }

  const rowMenuItems = computed(() => [
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: async (row) => {
        await handleDeleteRow(row)
      }
    }
  ])

  const areActionsDisabled = computed(() => {
    return edgeSQL.isNonEditableQuery(props.currentQuery)
  })

  const isAddRowDisabled = computed(() => {
    return isAddNewRowDisabled.value || areActionsDisabled.value
  })

  const csvDataMapper = computed(() => (data) => ({ ...data }))

  const csvFileName = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return `results-${today}`
  })

  const handleRowSave = (row) => {
    if (row?.data?.shouldInsert || row?.newData?.shouldInsert) {
      insertRowService(row.newData)
    } else {
      editRowService(row.newData, row.data)
    }
  }

  const handleRowCancel = (row) => {
    if (row.data.shouldInsert) {
      queryResults.value[0].rows.splice(row.index, 1)
    }
    editingRows.value.splice(row.index, 1)
    isAddNewRowDisabled.value = false
  }

  const handleAddRow = () => {
    if (!tableSchema.value?.rows) return

    isAddNewRowDisabled.value = true
    const newRow = createNewRowObject()
    addRowToEditingState(newRow)
    addRowToQueryResults(newRow)
  }

  const createNewRowObject = () => {
    const newRow = { shouldInsert: true, index: 0 }
    const schemaColumns = tableSchema.value.rows
    const hasIdColumn = schemaColumns.some((col) => col.name === 'id')

    schemaColumns.forEach((col) => {
      if (col.name === 'id' && hasIdColumn) {
        newRow[col.name] = 0
      } else {
        newRow[col.name] = ''
      }
    })

    if (!hasIdColumn) {
      newRow.id = 0
    }

    return newRow
  }

  const addRowToEditingState = (newRow) => {
    editingRows.value = [...editingRows.value, newRow]
  }

  const addRowToQueryResults = (newRow) => {
    if (!queryResults.value?.[0]) return

    const currentRows = [...(queryResults.value[0].rows || [])]
    const currentColumns = queryResults.value[0].columns || []

    if (currentRows.length > 0 && Array.isArray(currentRows[0])) {
      const newRowArray = currentColumns.map((col) => newRow[col] || '')
      currentRows.unshift(newRowArray)
    } else {
      currentRows.unshift(newRow)
    }

    queryResults.value = [
      {
        ...queryResults.value[0],
        rows: currentRows
      }
    ]
  }

  const tableKey = computed(() => {
    return tableColumns.value.map((col) => col.field).join('-')
  })

  const formattedTableData = computed(() => {
    const rows = queryResults.value?.[0]?.rows || []
    const columns = queryResults.value?.[0]?.columns || []

    return rows.map((row, index) => {
      const rowObject = { id: index, index }

      if (Array.isArray(row)) {
        columns.forEach((col, colIndex) => {
          rowObject[col] = row[colIndex]
        })
      } else {
        Object.assign(rowObject, row)
      }

      return rowObject
    })
  })

  const refreshQueryResults = () => {
    const query = SQLITE_QUERIES.SELECT_ALL(props.tableName)
    emit('execute-query', query)
  }

  const loadTableSchema = async (tableName) => {
    try {
      const result = await edgeSQLService.queryDatabase(databaseId.value, {
        statements: SQLITE_QUERIES.TABLE_INFO(tableName),
        parameters: []
      })

      tableSchema.value = {
        name: tableName,
        columns: result.results[0].columns || [],
        rows: result.results[0].rows || []
      }
    } catch (error) {
      // Log error for debugging
      // eslint-disable-next-line no-console
      console.error('Failed to load table schema:', error)
    }
  }

  const filterValidSchemaKeys = (obj, schemaKeys) => {
    const allowedKeys = schemaKeys.map((key) => key.name)
    const filteredObj = {}

    Object.keys(obj).forEach((key) => {
      if (allowedKeys.includes(key)) {
        filteredObj[key] = obj[key]
      }
    })

    return filteredObj
  }

  const editRowService = async (newData, whereData) => {
    shouldCleanEditingRows.value = false
    const filteredNewData = filterValidSchemaKeys(newData, tableSchema.value.rows)
    const filteredWhereData = filterValidSchemaKeys(whereData, tableSchema.value.rows)

    try {
      await edgeSQLService.updatedRow(databaseId.value, {
        tableName: props.tableName,
        newData: filteredNewData,
        whereData: filteredWhereData,
        tableSchema: tableSchema.value.rows
      })

      toast.add({
        severity: 'success',
        summary: 'Row Updated',
        detail: 'The row has been updated successfully',
        life: 2000
      })

      refreshQueryResults()
    } finally {
      editingRows.value = []
      shouldCleanEditingRows.value = true
    }
  }

  const insertRowService = async (newData) => {
    shouldCleanEditingRows.value = false
    const filteredData = filterValidSchemaKeys(newData, tableSchema.value.rows)

    try {
      await edgeSQLService.insertRow(databaseId.value, {
        tableName: props.tableName,
        dataToInsert: filteredData,
        tableSchema: tableSchema.value.rows
      })

      toast.add({
        severity: 'success',
        summary: 'Row Inserted',
        detail: 'The new row has been inserted successfully',
        life: 2000
      })

      refreshQueryResults()
    } finally {
      editingRows.value = []
      shouldCleanEditingRows.value = true
      isAddNewRowDisabled.value = false
    }
  }

  // Watchers
  watch(
    () => props.queryResults,
    (newResults) => {
      queryResults.value = newResults
      isAddNewRowDisabled.value = false
    },
    { immediate: true }
  )

  watch(
    () => props.tableName,
    (tableName) => {
      if (tableName) {
        loadTableSchema(tableName)
      }
    },
    { immediate: true }
  )
</script>
