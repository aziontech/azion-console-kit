<template>
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

      <div class="border-round-lg shadow-sm border-1 surface-border overflow-hidden">
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
    v-else-if="!responseQuery[0]?.rows?.length"
    class="flex flex-col items-center justify-center text-center p-8 min-h-[300px]"
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
      v-for="(result, index) in responseQuery"
      :key="index"
      class="mb-6"
    >
      <div
        class="flex justify-content-between align-items-center mb-3 p-3 bg-surface-50 dark:bg-surface-800 border-round-lg"
      >
        <h4 class="text-base font-semibold text-color flex items-center gap-2">
          <i class="pi pi-list text-primary"></i>
          {{ responseQuery.length > 1 ? `Result ${index + 1}` : 'Query Results' }}
          <Tag
            v-if="result.rows?.length"
            :value="`${result.rows.length} row${result.rows.length > 1 ? 's' : ''}`"
            severity="info"
            class="text-xs"
          />
        </h4>

        <div class="flex items-center gap-2">
          <Button
            v-if="result.columns?.length"
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
            :disabled="!selectedRows.length"
            v-tooltip.top="`Export ${selectedRows.length || 0} selected row(s)`"
          />
        </div>
      </div>

      <div
        v-if="result.columns?.length"
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
                return instance.isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
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
            :alignFrozen="colIndex === 0 && isPrimaryKey(column.field) ? 'left' : undefined"
          >
            <template #header>
              <span>{{ column.header }}</span>
            </template>

            <template #body="{ data, field, index }">
              <div
                class="table-cell-content cursor-pointer"
                @click="handleCellClickWithStopPropagation(data, field, $event)"
                @dblclick="handleCellDoubleClickWithStopPropagation(data, index, field, $event)"
                :title="`Click to copy • Double-click to edit`"
              >
                <span
                  class="cell-value"
                  :class="{
                    'text-color-secondary italic': data[field] === null || data[field] === undefined
                  }"
                >
                  {{ data[field] }}
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
</template>
<script setup>
  import { ref, watch } from 'vue'

  defineOptions({ name: 'results-block' })
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Skeleton from 'primevue/skeleton'
  import Tag from 'primevue/tag'
  import Button from 'primevue/button'

  const emit = defineEmits(['open-insert-row-drawer', 'open-edit-row-drawer'])
  const selectedRows = ref([])

  const rowsPerPage = ref(6)
  const currentPage = ref(0)
  const onPageChange = (event) => {
    currentPage.value = event.page
    rowsPerPage.value = event.rows
  }

  const props = defineProps({
    queryResults: {
      type: Array,
      default: () => []
    },
    isExecutingQuery: {
      type: Boolean,
      default: false
    },
    selectedTableSchema: {
      type: Object,
      default: () => null
    }
  })

  const responseQuery = ref(props.queryResults)

  const handleCellDoubleClickWithStopPropagation = (data, index, field, event) => {
    event.stopPropagation()
    emit('open-edit-row-drawer', data, index, field)
  }

  const openInsertRowDrawer = () => {
    emit('open-insert-row-drawer')
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

  const exportAllResults = () => {
    if (!props.queryResults.length) return

    const result = props.queryResults[0]
    const exportData = formatResultData(result).map((row) => {
      const cleanRow = { ...row }
      delete cleanRow._rowId
      return cleanRow
    })

    const csv = convertToCSV(exportData)
    downloadCSV(csv, `edge-sql-all-results-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportSelectedRows = () => {
    if (!selectedRows.value.length) return

    const exportData = selectedRows.value.map((row) => {
      const cleanRow = { ...row }
      delete cleanRow._rowId
      return cleanRow
    })

    const csv = convertToCSV(exportData)
    downloadCSV(csv, `edge-sql-selected-rows-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const formatResultColumns = (result) => {
    return (
      result.columns?.map((col) => ({
        field: col,
        header: col
      })) || []
    )
  }

  const isPrimaryKey = (columnName) => {
    if (!props.selectedTableSchema?.columns) return false
    const columnInfo = props.selectedTableSchema.columns.find((col) => col[1] === columnName)
    return columnInfo ? columnInfo[5] === 1 : false
  }

  watch(
    () => props.queryResults,
    (newQueryResults) => {
      responseQuery.value = newQueryResults
    }
  )
</script>
