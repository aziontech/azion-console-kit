<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import { computed, ref } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import Drawer from './Drawer'

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
    filterData: {
      type: Object,
      default: () => ({})
    }
  })

  const listTableBlockRef = ref('')
  const drawerRef = ref('')

  const openDetailDrawer = ({ configurationId, ts, host, source, proxyHost }) => {
    drawerRef.value.openDetailDrawer({
      ...props.filterData,
      configurationId,
      ts,
      host,
      source,
      proxyHost
    })
  }

  const reloadListTable = () => {
    listTableBlockRef.value.reload()
  }

  const listProvider = async () => {
    return await props.listTieredCache({ ...props.filterData })
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
    lazyLoad
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
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
