<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import { computed, ref } from 'vue'
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

  const reloadListTable = () => {
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
  const customColumnMapper = (rowData) => ({
    upstreamCacheStatus: rowData.data.content
  })

  defineExpose({
    reloadListTable
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadTieredCache"
    :clipboardWrite="props.clipboardWrite"
  />
  <ListTableBlock
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No logs have been found for this period."
    isTabs
    exportFileName="tiered-cache-logs"
    :csvMapper="customColumnMapper"
  >
    <template #header="{ exportTableCSV }">
      <slot
        name="header"
        :downloadCSV="exportTableCSV"
      />
    </template>
  </ListTableBlock>
</template>
