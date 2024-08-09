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
    listEdgeFunctionsConsole: {
      type: Function,
      required: true
    },
    loadEdgeFunctionsConsole: {
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
  const router = useRouter()
  const drawerRef = ref('')

  const openDetailDrawer = ({ configurationId, ts, source, line, originalId }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      configurationId,
      source,
      id: originalId,
      ts,
      line
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
    return await props.listEdgeFunctionsConsole({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'functionId',
        header: 'Function Id'
      },
      {
        field: 'lineSource',
        header: 'Line Source',
        filterPath: 'lineSource.content',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'level',
        header: 'Level',
        type: 'component',
        filterPath: 'level.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'line',
        header: 'Line',
        type: 'component',
        filterPath: 'line',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const handleExport = (rowData) => {
    const rowDataMapper = {
      lineSource: rowData.data.content,
      level: rowData.data.content,
      line: rowData.data.value
    }
    return rowDataMapper[rowData.field] || rowData.data
  }

  const goToEdgeFunction = () => {
    router.push({ name: 'list-edge-functions' })
  }
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadEdgeFunctionsConsole"
  />
  <div class="flex flex-col gap-8 my-4">
    <div class="flex gap-1">
      <p class="text-xs font-medium leading-4">
        Logs of events from edge applications using Edge Runtime returned by Cells Console.
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
    exportFileName="edge-functions-console-logs"
    :csvMapper="handleExport"
  />

  <EmptyResultsBlock
    v-else
    title="No logs have been found for this period."
    description="There are no logs for the selected time range. Use the filter to change time range and variables, or use edge functions to generate activity. Logs are displayed once there are incoming requests and traffic."
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        label="Edge Functions"
        @click="goToEdgeFunction"
      />
    </template>
  </EmptyResultsBlock>
</template>
