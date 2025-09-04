<script setup>
  import { ref, computed } from 'vue'
  import { useEdgeSQL } from '../composable/useEdgeSQL'
  import TableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  defineOptions({ name: 'edge-sql-query-history' })

  const emit = defineEmits(['rerun-query'])

  const { queryResults, clearQueryResults } = useEdgeSQL()

  const hasContentToList = ref(true)
  const toast = useToast()
  const queryHistory = computed(() => queryResults.value)

  const rerunQuery = (historyItem) => {
    emit('rerun-query', historyItem.query)
  }

  const clearHistory = () => {
    clearQueryResults()
    toast.add({
      severity: 'info',
      summary: 'History Cleared',
      detail: 'Query history has been cleared successfully',
      life: 2000
    })
  }

  const documentationService = () => {
    window.open('https://www.azion.com/en/documentation/products/edge-sql/', '_blank')
  }

  const getQueryHistory = () => {
    return queryHistory.value
  }

  const actions = [
    {
      type: 'action',
      icon: 'pi  pi-arrow-circle-right',
      commandAction: (item) => rerunQuery(item)
    }
  ]

  const columns = computed(() => {
    return [
      {
        field: 'type',
        header: 'Type',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      },
      { field: 'query', header: 'Query' },
      {
        field: 'executionTime',
        header: 'Execution Time',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: {
              text: columnData || '-',
              ...(columnData && { leftIcon: 'pi pi-history' })
            },
            columnAppearance: 'text-with-icon'
          })
        }
      },
      { field: 'timestamp', header: 'Executed At' }
    ]
  })

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>

<template>
  <div class="h-full mt-8">
    <TableBlock
      v-if="hasContentToList"
      :listService="getQueryHistory"
      :columns="columns"
      :hasExportToCsv="true"
      :enableEditClick="false"
      :actions="actions"
      @on-load-data="handleLoadData"
      :csvMapper="(data) => ({ ...data })"
      :exportFileName="`query-results`"
    >
      <template #actionsHeader>
        <PrimeButton
          @click="clearHistory"
          icon="pi pi-times-circle"
          outlined
          class="max-sm:w-full ml-auto mr-2"
          :data-testid="`clear_history_button`"
          v-tooltip.bottom="{ value: 'Clear History', showDelay: 200 }"
        />
      </template>
    </TableBlock>

    <EmptyResultsBlock
      v-else
      title="No queries executed yet"
      description="Execute queries to see them appear in your history"
      :documentationService="documentationService"
      inTabs
      noBorder
    >
      <template #illustration>
        <i class="pi pi-history text-6xl text-primary opacity-50"></i>
      </template>
    </EmptyResultsBlock>
  </div>
</template>
