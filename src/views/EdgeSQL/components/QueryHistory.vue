<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useEdgeSQL } from '../composable/useEdgeSQL'
  import TableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PrimeButton from 'primevue/button'
  import ToggleButton from 'primevue/togglebutton'
  import { useToast } from 'primevue/usetoast'
  defineOptions({ name: 'edge-sql-query-history' })

  const emit = defineEmits(['rerun-query'])
  const route = useRoute()
  const tableBlock = ref(null)
  const showCurrentDatabaseOnly = ref(false)

  const { clearQueryResults, queryResults, getQueryHistoryForDatabase } = useEdgeSQL()

  const currentDatabaseId = computed(() => route.params.id)

  const hasContentToList = ref(true)
  const toast = useToast()

  const rerunQuery = (historyItem) => {
    emit('rerun-query', historyItem.originalQuery)
  }

  const clearHistory = () => {
    clearQueryResults()
    tableBlock.value?.reload()
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

  const filteredHistory = computed(() => {
    if (!showCurrentDatabaseOnly.value || !currentDatabaseId.value) {
      return queryResults.value
    }
    return getQueryHistoryForDatabase(currentDatabaseId.value)
  })

  const getQueryHistory = () => {
    return Promise.resolve(filteredHistory.value)
  }

  const actions = [
    {
      type: 'action',
      icon: 'pi pi-arrow-circle-right',
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

  // Watch for changes in queryResults to automatically reload table
  watch(
    () => queryResults.value,
    () => {
      tableBlock.value?.reload()
    },
    { deep: true }
  )

  // Watch for database filter changes
  watch(showCurrentDatabaseOnly, () => {
    tableBlock.value?.reload()
  })

  onMounted(() => {
    // Trigger table reload if it exists
    if (tableBlock.value?.reload) {
      tableBlock.value.reload()
    }
  })
</script>

<template>
  <div class="h-full mt-8">
    <TableBlock
      v-if="hasContentToList"
      ref="tableBlock"
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
        <div class="flex gap-2 items-center">
          <ToggleButton
            v-model="showCurrentDatabaseOnly"
            onLabel="Current DB"
            offLabel="All DBs"
            onIcon="pi pi-database"
            offIcon="pi pi-globe"
            class="p-button-sm"
            v-tooltip.bottom="{
              value: showCurrentDatabaseOnly
                ? 'Showing current database only'
                : 'Showing all databases',
              showDelay: 200
            }"
          />
          <PrimeButton
            @click="clearHistory"
            icon="pi pi-times-circle"
            outlined
            class="max-sm:w-full"
            :data-testid="`clear_history_button`"
            v-tooltip.bottom="{ value: 'Clear History', showDelay: 200 }"
          />
        </div>
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
