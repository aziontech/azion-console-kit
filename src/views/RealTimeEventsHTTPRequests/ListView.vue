<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import { computed, ref } from 'vue'
  import Drawer from './Drawer'

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    loadHttpRequest: {
      type: Function,
      required: true
    },
    listHttpRequest: {
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

  const openDetailDrawer = ({ configurationId, ts, requestId }) => {
    drawerRef.value.openDetailDrawer({
      ...props.filterData,
      configurationId,
      requestId,
      ts
    })
  }

  const reloadListTable = () => {
    listTableBlockRef.value.reload()
  }

  const listProvider = async () => {
    return await props.listHttpRequest({ ...props.filterData })
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
        field: 'status',
        header: 'Status'
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const customColumnMapper = (rowData) => ({
    tsFormat: rowData.data
  })

  defineExpose({
    reloadListTable
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadHttpRequest"
  />

  <ListTableBlock
    lazyLoad
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    emptyListMessage="No logs have been found for this period."
    isTabs
    exportFileName="http-requests-logs"
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
