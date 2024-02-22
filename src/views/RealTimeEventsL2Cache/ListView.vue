<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import Drawer from './Drawer'

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    listL2Cache: {
      type: Function,
      required: true
    },
    loadL2Cache: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const filterDate = ref({})
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
    return await props.listL2Cache({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'bytesSent',
        header: 'Bytes Sent'
      },
      {
        field: 'cacheKey',
        header: 'Cache Key',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-clipboard',
            dependencies: {
              copyContentService: props.clipboardWrite
            }
          })
        }
      },
      {
        field: 'cacheTtl',
        header: 'Cache Ttl'
      },
      {
        field: 'clientId',
        header: 'Client ID'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'host',
        header: 'Host'
      },
      {
        field: 'proxyHost',
        header: 'Proxy Host'
      }
    ]
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadL2Cache"
    :clipboardWrite="props.clipboardWrite"
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
    description="Change the time range to search other logs or create new Edge Function. They are displayed when there are requests and traffic received in the period selected."
    createButtonLabel="create button label"
    :documentationService="documentationService"
    :inTabs="true"
  />
</template>
