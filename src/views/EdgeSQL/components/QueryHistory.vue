<script setup>
  import { computed } from 'vue'
  import { useEdgeSQLStore } from '@/stores/edge-sql'
  
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Button from 'primevue/button'
  import Tag from 'primevue/tag'
  import Textarea from 'primevue/textarea'

  defineOptions({ name: 'edge-sql-query-history' })

  const emit = defineEmits(['rerun-query', 'clear-history'])
  
  const sqlStore = useEdgeSQLStore()
  
  const queryHistory = computed(() => sqlStore.queryResults)

  const formatExecutionTime = (time) => {
    return `${time}ms`
  }

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp))
  }

  const getQueryTypeLabel = (type) => {
    return type === 'query' ? 'SELECT' : 'EXECUTE'
  }

  const getQueryTypeSeverity = (type) => {
    return type === 'query' ? 'info' : 'success'
  }

  const truncateQuery = (query, maxLength = 100) => {
    if (query.length <= maxLength) return query
    return query.substring(0, maxLength) + '...'
  }

  const rerunQuery = (historyItem) => {
    emit('rerun-query', historyItem.query)
  }

  const clearHistory = () => {
    sqlStore.clearQueryResults()
    emit('clear-history')
  }

  const exportHistory = () => {
    const historyData = sqlStore.exportHistory()
    const blob = new Blob([JSON.stringify(historyData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = `edge-sql-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(url)
  }


</script>

<template>
  <div class="h-full">
    <div class="flex justify-content-between align-items-center mb-3 p-3 bg-surface-50 dark:bg-surface-800 border-round-lg">
      <h4 class="text-base font-semibold text-color flex items-center gap-2">
        <i class="pi pi-history text-primary"></i>
        Query History
        <Tag v-if="queryHistory.length > 0" :value="`${queryHistory.length} quer${queryHistory.length !== 1 ? 'ies' : 'y'}`" severity="info" class="text-xs" />
      </h4>
      
      <div class="flex items-center gap-2">
        <Button
          v-if="queryHistory.length > 0"
          icon="pi pi-download"
          severity="secondary"
          class="p-button-text p-button-sm !flex !items-center !justify-center w-8 h-8"
          @click="exportHistory"
          v-tooltip.top="'Export history'"
        />
        <Button
          v-if="queryHistory.length > 0"
          icon="pi pi-trash"
          severity="danger"
          class="p-button-text p-button-sm !flex !items-center !justify-center w-8 h-8"
          @click="clearHistory"
          v-tooltip.top="'Clear history'"
        />
      </div>
    </div>

    <div v-if="queryHistory.length === 0" class="flex flex-col items-center justify-center p-8 text-center">
      <i class="pi pi-history text-6xl text-primary mb-4 opacity-50"></i>
      <h4 class="text-lg font-medium text-color mb-2">No queries executed yet</h4>
      <p class="text-color-secondary">Execute queries to see them here</p>
    </div>

    <DataTable
      v-else
      :value="queryHistory"
      :scrollable="true"
      scrollHeight="400px"
      class="border-round-lg overflow-hidden shadow-sm"
      :paginator="false"
      :pt="{
        header: { class: 'bg-primary-50 dark:bg-primary-900/20' },
        table: { class: 'text-sm' }
      }"
    >
      <Column header="Type" style="width: 90px">
        <template #body="{ data }">
          <Tag
            :value="getQueryTypeLabel(data.type)"
            :severity="getQueryTypeSeverity(data.type)"
            class="text-xs font-medium"
          />
        </template>
      </Column>

      <Column header="Query" style="min-width: 300px">
        <template #body="{ data }">
          <div class="query-preview">
            <code class="text-xs text-color-secondary font-mono flex-1">
              {{ truncateQuery(data.query) }}
            </code>
            <Button
              icon="pi pi-play"
              severity="primary"
              class="p-button-sm ml-2 !flex !items-center !justify-center w-6 h-6"
              @click="rerunQuery(data)"
              v-tooltip.top="'Run again'"
            />
          </div>
        </template>
      </Column>

      <Column header="Time" style="width: 100px">
        <template #body="{ data }">
          <span class="text-sm text-color-secondary flex items-center gap-1">
            <i class="pi pi-clock text-xs"></i>
            {{ formatExecutionTime(data.executionTime) }}
          </span>
        </template>
      </Column>

      <Column header="Executed At" style="width: 160px">
        <template #body="{ data }">
          <span class="text-xs text-color-secondary">
            {{ formatTimestamp(data.timestamp) }}
          </span>
        </template>
      </Column>

      <template #expansion="{ data }">
        <div class="p-4 bg-surface-50 dark:bg-surface-800">
          <h5 class="mb-3 text-color flex items-center gap-2">
            <i class="pi pi-code text-primary"></i>
            Complete Query:
          </h5>
          <Textarea
            :value="data.query"
            :autoResize="true"
            readonly
            class="w-full font-mono text-sm border-round-md"
            rows="3"
          />
          
          <div v-if="data.results?.length > 0" class="mt-4">
            <h5 class="mb-2 text-color flex items-center gap-2">
              <i class="pi pi-list text-primary"></i>
              Results:
            </h5>
            <p class="text-sm text-color-secondary">
              {{ data.results.reduce((total, result) => total + (result.rows?.length || 0), 0) }} row(s) returned
            </p>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.query-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 100%;
}

.query-preview code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: transparent;
  padding: 0;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem;
}

:deep(.p-panel .p-panel-content) {
  padding: 1rem;
}
</style> 