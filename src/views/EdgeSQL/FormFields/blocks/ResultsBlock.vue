<template>
  <div>
    <div
      v-for="(result, index) in responseQuery"
      :key="index"
      class="mb-6"
    >
      <div
        v-if="result.columns?.length"
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
    </div>
    <ListTableBlock
      isTabs
      hiddenHeader
      v-if="hasContentToList"
      :isLoading="isExecutingQuery"
      :listService="listTableService"
      :columns="columns"
      addButtonLabel="Insert"
      createPagePath="edge-sql/insert"
      ref="refListTable"
      @on-load-data="handleLoadData"
      emptyListMessage="No results found."
      @on-row-click-edit-redirect="handleEditRedirect"
      enableEditCustomRedirect
    >
    </ListTableBlock>

    <EmptyResultsBlock
      v-else
      title="Ready to execute"
      class="mt-4"
      description="Execute a query to see the results here"
      :showLearnMoreButton="false"
    ></EmptyResultsBlock>
  </div>
</template>
<script setup>
  import { ref, watch, computed } from 'vue'

  defineOptions({ name: 'results-block' })
  import Tag from 'primevue/tag'
  import Button from 'primevue/button'
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'

  const emit = defineEmits(['open-insert-row-drawer', 'open-edit-row-drawer'])
  const selectedRows = ref([])
  const hasContentToList = ref(false)

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

  const columns = computed(() => {
    if (!responseQuery.value[0]?.columns) return []
    return responseQuery.value[0].columns.map((col) => {
      return {
        field: col,
        header: col
      }
    })
  })

  const handleEditRedirect = (row) => {
    emit('open-edit-row-drawer', row)
  }

  const responseQuery = ref(props.queryResults)

  const listTableService = () => {
    return responseQuery.value[0].rows
  }

  const openInsertRowDrawer = () => {
    emit('open-insert-row-drawer')
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
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

  watch(
    () => props.queryResults,
    (newQueryResults) => {
      responseQuery.value = newQueryResults
    }
  )

  watch(
    () => props.isExecutingQuery,
    (newValue) => {
      if (!newValue) {
        hasContentToList.value = true
      }
    }
  )
</script>
