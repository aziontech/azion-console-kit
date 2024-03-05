<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import Drawer from './Drawer'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useRouter } from 'vue-router'
  const emit = defineEmits(['update:dateTime'])

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
    },
    dateTime: {
      type: Object,
      default: () => ({})
    }
  })

  const filterDate = computed({
    get: () => {
      return props.dateTime
    },
    set: (value) => {
      emit('update:dateTime', value)
    }
  })

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
        filterPath: 'endpointType.content',
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
        filterPath: 'jobName.content',
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
      <p class="text-xs font-medium leading-4">Logs of data sent to endpoints by Data Streaming.</p>
    </div>
    <IntervalFilterBlock
      v-model:filterDate="filterDate"
      @applyTSRange="reloadList"
    />
  </div>
  <ListTableBlock
    v-if="hasContentToList && filterDate.tsRangeBegin"
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No logs have been found for this period."
  />

  <EmptyResultsBlock
    v-else
    title="No logs have been found for this period."
    description="Use the filter to change time range and variables, or create a new stream with Data Streaming. Logs are displayed once there are incoming requests and traffic."
    :documentationService="documentationService"
    :inTabs="true"
  >
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
