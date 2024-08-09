<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import Drawer from './Drawer'
  import { useRouter } from 'vue-router'
  const emit = defineEmits(['update:dateTime'])

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    listEdgeFunctions: {
      type: Function,
      required: true
    },
    loadEdgeFunctions: {
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

  const openDetailDrawer = ({ configurationId, ts, requestId }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      configurationId,
      requestId,
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
    return await props.listEdgeFunctions({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'functionLanguage',
        header: 'Function Language'
      },
      {
        field: 'edgeFunctionsInitiatorTypeList',
        header: 'Edge Functions Initiator Type List'
      },
      {
        field: 'edgeFunctionsList',
        header: 'Edge Functions List',
        filterPath: 'edgeFunctionsList',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'edgeFunctionsTime',
        header: 'Edge Functions Time'
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const handleExport = (rowData) => {
    const rowDataMapper = {
      edgeFunctionsList: rowData.data.value
    }
    return rowDataMapper[rowData.field] || rowData.data
  }

  const goToCreateEdgeFunction = () => {
    router.push({ name: 'create-edge-functions' })
  }
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadEdgeFunctions"
  />
  <div class="flex flex-col gap-8 my-4">
    <div class="flex gap-1">
      <p class="text-xs font-medium leading-4">
        Logs of events from requests made to your edge functions.
      </p>
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
    isTabs
    exportFileName="edge-functions-logs"
    :csvMapper="handleExport"
  />

  <EmptyResultsBlock
    v-else
    title="No logs have been found for this period."
    description="Use the filter to change time range and variables, or create a new edge function. Logs are displayed once there are incoming requests and traffic."
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Edge Functions"
        @click="goToCreateEdgeFunction"
      />
    </template>
  </EmptyResultsBlock>
</template>
