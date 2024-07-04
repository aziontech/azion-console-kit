<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/index.vue'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import Drawer from './Drawer'
  const emit = defineEmits(['update:dateTime'])

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    listTieredCache: {
      type: Function,
      required: true
    },
    loadTieredCache: {
      type: Function,
      required: true
    },
    clipboardWrite: {
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

  const openDetailDrawer = ({ configurationId, ts, host, source, proxyHost }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      configurationId,
      ts,
      host,
      source,
      proxyHost
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
    return await props.listTieredCache({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'host',
        header: 'Host'
      },
      {
        field: 'requestUri',
        header: 'Request Uri'
      },
      {
        field: 'requestMethod',
        header: 'Request Method'
      },
      {
        field: 'upstreamCacheStatus',
        header: 'Upstream Cache Status',
        type: 'component',
        filterPath: 'upstreamCacheStatus.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadTieredCache"
    :clipboardWrite="props.clipboardWrite"
  />
  <div class="flex flex-col gap-8 my-4">
    <div class="flex gap-1">
      <p class="text-xs font-medium leading-4">
        Logs of events from requests made to edge applications using Tiered Cache.
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
  />

  <EmptyResultsBlock
    v-else
    title="No logs have been found for this period."
    description="Use the filter to change time range and variables, or create a new edge application with Tiered Cache configurations. Logs are displayed once there are incoming requests and traffic."
    createButtonLabel="Edge Application"
    createPagePath="/edge-applications/create?origin=realTimeEvents"
    :documentationService="documentationService"
    :inTabs="true"
  />
</template>
