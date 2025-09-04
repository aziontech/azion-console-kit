<template>
  <div class="mt-8">
    <ListTableBlockWithRowEdit
      v-if="hasContentToList && hasResults"
      :columns="columns"
      :data="listTableService"
      :key="tableKey"
      @row-edit-save="handleRowSave"
      :hasExportToCsv="true"
      :editingRows="editingRows"
      :frozenSize="'0.1rem'"
    >
      <template #addButton>
        <Button
          label="Insert"
          icon="pi pi-plus"
          severity="primary"
          class="p-button-sm font-medium"
          @click="insertRow"
        />
      </template>
    </ListTableBlockWithRowEdit>

    <EmptyResultsBlock
      v-else
      title="Ready to execute"
      description="Execute a query to see the results here"
      :showLearnMoreButton="false"
    ></EmptyResultsBlock>
  </div>
</template>
<script setup>
  import { ref, watch, computed } from 'vue'
  import ListTableBlockWithRowEdit from '@/templates/list-table-block/with-row-edit'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Button from 'primevue/button'
  import { edgeSQLService } from '@/services/v2'
  import { useRoute } from 'vue-router'
  import { SQLITE_QUERIES } from '../../constants'
  import { useToast } from 'primevue/usetoast'
  defineOptions({ name: 'results-block' })
  const emit = defineEmits(['execute-query'])

  const route = useRoute()
  const toast = useToast()

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
    }
  })

  const hasContentToList = ref(false)
  const editingRows = ref([])

  const responseQuery = ref(props.queryResults)
  const selectedTableSchema = ref(null)
  const databaseId = computed(() => route.params.id)

  const columns = computed(() => {
    const firstResult = responseQuery.value?.[0]
    if (!firstResult?.columns?.length) return []

    return firstResult.columns.map((col) => ({
      field: col,
      header: col
    }))
  })

  const hasResults = computed(() => {
    return responseQuery.value?.length > 0 && responseQuery.value[0]?.rows?.length > 0
  })

  const handleRowSave = (row) => {
    if (row.data.shouldInsert) {
      insertRowService(row.newData)
    } else {
      editRowService(row.newData, row.data)
    }
  }

  const getDefaultValueByType = (type) => {
    const typeStr = type?.toLowerCase() || 'unknown'

    if (typeStr.includes('int') || typeStr.includes('number')) {
      return 'Value: number'
    } else if (typeStr.includes('bool')) {
      return `Value: boolean`
    } else if (typeStr.includes('date') || typeStr.includes('time')) {
      return 'Value: date'
    } else if (
      typeStr.includes('text') ||
      typeStr.includes('varchar') ||
      typeStr.includes('char')
    ) {
      return 'Value: string'
    } else {
      return 'Value: unknown'
    }
  }

  const insertRow = () => {
    if (!selectedTableSchema.value?.rows) return

    const newRow = {
      shouldInsert: true
    }
    const schemaColumns = selectedTableSchema.value.rows
    const hasIdColumn = schemaColumns.some((col) => col.name === 'id')

    schemaColumns.forEach((col) => {
      if (col.name === 'id' && hasIdColumn) {
        newRow[col.name] = 0
      } else {
        if (col.dflt_value && col.dflt_value !== 'NULL') {
          newRow[col.name] = col.dflt_value
        } else {
          newRow[col.name] = getDefaultValueByType(col.type)
        }
      }
    })

    const currentEditingRows = [...editingRows.value]

    if (!hasIdColumn) {
      newRow.id = 0
    }
    currentEditingRows.push(newRow)
    editingRows.value = currentEditingRows

    if (responseQuery.value?.[0]) {
      const currentRows = [...(responseQuery.value[0].rows || [])]
      const currentColumns = responseQuery.value[0].columns || []

      if (currentRows.length > 0 && Array.isArray(currentRows[0])) {
        const newRowArray = currentColumns.map((col) => newRow[col] || '')
        currentRows.unshift(newRowArray)
      } else {
        currentRows.unshift(newRow)
      }

      responseQuery.value = [
        {
          ...responseQuery.value[0],
          rows: currentRows
        }
      ]
    }
  }

  const tableKey = computed(() => {
    return columns.value.map((col) => col.field).join('-')
  })

  const listTableService = computed(() => {
    const rows = responseQuery.value?.[0]?.rows || []
    const columns = responseQuery.value?.[0]?.columns || []

    const result = rows.map((row, index) => {
      const rowObject = { id: index }
      if (Array.isArray(row)) {
        columns.forEach((col, colIndex) => {
          rowObject[col] = row[colIndex]
        })
      } else {
        Object.assign(rowObject, row)
      }
      return rowObject
    })
    return result
  })

  const executeQuery = () => {
    const query = SQLITE_QUERIES.SELECT_ALL(props.tableName)
    emit('execute-query', query)
  }

  const loadTableSchema = async (tableName) => {
    const result = await edgeSQLService.queryDatabase(databaseId.value, {
      statement: SQLITE_QUERIES.TABLE_INFO(tableName),
      parameters: []
    })
    selectedTableSchema.value = {
      name: tableName,
      columns: result.results[0].columns || [],
      rows: result.results[0].rows || []
    }
  }

  const removeKeyDoesNotMatch = (obj, keys) => {
    const newObj = {}
    const allowedKeys = keys.map((key) => key.name)

    Object.keys(obj).forEach((objKey) => {
      if (allowedKeys.includes(objKey)) {
        newObj[objKey] = obj[objKey]
      }
    })

    return newObj
  }

  const editRowService = async (newData, whereData) => {
    const newDataWithoutKeyDoesNotMatch = removeKeyDoesNotMatch(
      newData,
      selectedTableSchema.value.rows
    )
    const whereDataWithoutKeyDoesNotMatch = removeKeyDoesNotMatch(
      whereData,
      selectedTableSchema.value.rows
    )
    try {
      await edgeSQLService.updatedRow(databaseId.value, {
        tableName: props.tableName,
        newData: newDataWithoutKeyDoesNotMatch,
        whereData: whereDataWithoutKeyDoesNotMatch,
        tableSchema: selectedTableSchema.value.rows
      })

      executeQuery()
    } finally {
      toast.add({
        severity: 'success',
        summary: 'Row Updated',
        detail: 'The row has been updated successfully',
        life: 2000
      })
    }
  }

  const insertRowService = async (newData) => {
    const newDataWithoutKeyDoesNotMatch = removeKeyDoesNotMatch(
      newData,
      selectedTableSchema.value.rows
    )

    try {
      await edgeSQLService.insertRow(databaseId.value, {
        tableName: props.tableName,
        dataToInsert: newDataWithoutKeyDoesNotMatch,
        tableSchema: selectedTableSchema.value.rows
      })

      toast.add({
        severity: 'success',
        summary: 'Row Inserted',
        detail: 'The new row has been inserted successfully',
        life: 2000
      })

      executeQuery()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Insert Failed',
        detail: error.message || 'Failed to insert row',
        life: 3000
      })
    }
  }

  watch(
    () => props.queryResults,
    (newResults) => {
      responseQuery.value = newResults
      if (newResults?.length > 0) {
        hasContentToList.value = true
      }
    }
  )

  watch(
    () => props.tableName,
    (tableName) => {
      loadTableSchema(tableName)
    }
  )
</script>
