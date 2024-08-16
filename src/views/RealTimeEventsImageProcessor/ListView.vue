<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import { computed, ref } from 'vue'
  import Drawer from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    listImageProcessor: {
      type: Function,
      required: true
    },
    loadImageProcessor: {
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

  const openDetailDrawer = ({ configurationId, ts, httpUserAgent, httpReferer }) => {
    drawerRef.value.openDetailDrawer({
      ...props.filterData,
      configurationId,
      httpReferer,
      httpUserAgent,
      ts
    })
  }

  const reloadListTable = () => {
    listTableBlockRef.value.reload()
  }

  const listProvider = async () => {
    return await props.listImageProcessor({ ...props.filterData })
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
        header: 'Request Uri',
        type: 'component',
        filterPath: 'requestUri',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'status',
        header: 'Status'
      },
      {
        field: 'bytesSent',
        header: 'Bytes Sent'
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const customColumnMapper = (rowData) => ({
    requestUri: rowData.data.value
  })

  defineExpose({
    reloadListTable
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadImageProcessor"
  />
  <ListTableBlock
    lazyLoad
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    emptyListMessage="No logs have been found for this period."
    isTabs
    exportFileName="image-processor-logs"
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
