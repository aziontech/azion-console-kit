<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import Drawer from './Drawer'
  import { computed, ref } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    loadDataStream: {
      type: Function,
      required: true
    },
    listDataStream: {
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
  const openDetailDrawer = ({ configurationId, ts }) => {
    drawerRef.value.openDetailDrawer({
      ...props.filterData,
      configurationId,
      ts
    })
  }

  const reloadListTable = () => {
    listTableBlockRef.value.reload()
  }

  const listProvider = async () => {
    return await props.listDataStream({ ...props.filterData })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'configurationId',
        header: 'Configuration ID'
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
        field: 'url',
        header: 'URL'
      },
      {
        field: 'statusCode',
        header: 'Status Code'
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const customColumnMapper = (rowData) => ({
    jobName: rowData.data.content,
    endpointType: rowData.data.content
  })

  defineExpose({
    reloadListTable
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadDataStream"
  />
  <ListTableBlock
    lazyLoad
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    emptyListMessage="No logs have been found for this period."
    isTabs
    exportFileName="data-stream-logs"
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
