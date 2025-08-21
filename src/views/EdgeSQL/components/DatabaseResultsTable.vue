<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Query Results</h3>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-download"
          @click="exportResults"
          :disabled="!queryResults.length"
          text
          size="small"
          label="Export"
        />
        <Button
          icon="pi pi-refresh"
          @click="$emit('refresh')"
          text
          size="small"
          label="Refresh"
        />
      </div>
    </div>

    <div
      v-if="queryResults.length === 0"
      class="text-center py-8 text-surface-500"
    >
      No results to display
    </div>

    <DataTable
      v-else
      :value="queryResults"
      :paginator="true"
      :rows="rowsPerPage"
      :page="currentPage"
      @page="onPageChange"
      :scrollable="true"
      scrollHeight="400px"
      class="border border-surface-200 rounded-lg"
      data-testid="query-results-table"
    >
      <Column
        v-for="column in tableColumns"
        :key="column.field"
        :field="column.field"
        :header="column.header"
        :sortable="true"
        :filter="true"
        :showFilterMenu="false"
        class="min-w-[150px]"
      >
        <template #body="{ data, field }">
          <div
            class="table-cell-content cursor-pointer"
            @click="handleCellClick(data, field)"
          >
            {{ formatCellValue(data[field]) }}
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Button from 'primevue/button'

  const props = defineProps({
    queryResults: {
      type: Array,
      default: () => []
    },
    rowsPerPage: {
      type: Number,
      default: 20
    },
    currentPage: {
      type: Number,
      default: 0
    }
  })

  const emit = defineEmits(['page-change', 'cell-click', 'refresh', 'export'])

  const tableColumns = computed(() => {
    if (!props.queryResults.length) return []

    const firstRow = props.queryResults[0]
    return Object.keys(firstRow).map((key) => ({
      field: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
    }))
  })

  const onPageChange = (event) => {
    emit('page-change', event)
  }

  const handleCellClick = (data, field) => {
    emit('cell-click', { data, field })
  }

  const formatCellValue = (value) => {
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const exportResults = () => {
    emit('export')
  }
</script>

<style scoped>
  .table-cell-content {
    padding: 0.5rem;
    word-break: break-word;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
