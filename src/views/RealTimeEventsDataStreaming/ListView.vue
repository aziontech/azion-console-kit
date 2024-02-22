<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import Drawer from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    loadDataStreaming: {
      type: Function,
      required: true
    },
    listDataStreaming: {
      type: Function,
      required: true
    }
  })

  const filterDate = ref({})
  const hasContentToList = ref(true)
  const listTableBlockRef = ref('')
  const drawerRef = ref('')
  const router = useRouter()
  const openDetailDrawer = ({ configurationId, ts }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      configurationId,
      ts
    })
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const listProvider = async () => {
    return await props.listDataStreaming({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'dataStreamed',
        header: 'Data Streamed'
      },
      {
        field: 'endpointType',
        header: 'Endpoint Type',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'jobName',
        header: 'Job Name',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'source',
        header: 'Source'
      },
      {
        field: 'statusCode',
        header: 'Status Code'
      },
      {
        field: 'streamedLines',
        header: 'Streamed Lines'
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const goToCreateDataStreaming = () => {
    router.push({ name: 'create-data-streaming' })
  }
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadDataStreaming"
  />
  <div class="flex flex-col gap-8 my-4">
    <div class="flex gap-1">
      <p class="text-xs font-medium leading-4">Specification</p>
      <p class="text-xs font-normal leading-4">description here in english about this view</p>
    </div>
    <IntervalFilterBlock
      v-model:filterDate="filterDate"
      @applyTSRange="reloadList"
    />
  </div>
  <ListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No events found in this search."
  />

  <EmptyResultsBlock
    v-else
    title="No events found in this period."
    description="Change the time range to search other logs or create new Data Streaming.
They are displayed when there are requests and traffic received in the period selected."
    createButtonLabel="create button label"
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #extraActionsLeft>
      <PrimeButton
        severity="primary"
        outlined
        icon="pi pi-shopping-cart"
        label="Browser Template"
        @click="() => {}"
      />
    </template>
    <template #default>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="Data Streaming"
        @click="goToCreateDataStreaming"
      />
    </template>
  </EmptyResultsBlock>
</template>
