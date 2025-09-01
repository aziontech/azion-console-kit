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
      </div>
    </div>
    <ListTableBlock
      :key="tableKey"
      isTabs
      ref="refListTable"
      v-if="hasContentToList && hasResults"
      :isLoading="isExecutingQuery"
      :listService="listTableService"
      :columns="columns"
      @on-load-data="handleLoadData"
      emptyListMessage="No results found."
      @on-row-click-edit-redirect="handleEditRedirect"
      enableEditCustomRedirect
      :csvMapper="(data) => ({ ...data })"
      :exportFileName="`query-results`"
    >
      <template #addButton>
        <Button
          label="Insert"
          icon="pi pi-plus"
          severity="primary"
          class="p-button-sm font-medium"
          @click="openInsertRowDrawer"
        />
      </template>
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
  import Tag from 'primevue/tag'
  import Button from 'primevue/button'
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'

  defineOptions({ name: 'results-block' })

  const emit = defineEmits(['open-insert-row-drawer', 'open-edit-row-drawer'])

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

  const hasContentToList = ref(false)
  const refListTable = ref(null)

  const responseQuery = computed(() => props.queryResults)

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

  // Generate a key based on columns to force re-render when columns change
  const tableKey = computed(() => {
    return columns.value.map((col) => col.field).join('-')
  })

  const handleEditRedirect = (row) => {
    emit('open-edit-row-drawer', row)
  }

  const listTableService = () => {
    return responseQuery.value?.[0]?.rows || []
  }

  const openInsertRowDrawer = () => {
    emit('open-insert-row-drawer')
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const reloadTable = () => {
    refListTable.value?.reload?.({})
  }

  watch(
    () => props.queryResults,
    () => {
      reloadTable()
    },
    { deep: true }
  )

  watch(
    () => props.isExecutingQuery,
    (isExecuting) => {
      if (!isExecuting && hasResults.value) {
        hasContentToList.value = true
      }
    }
  )
</script>
