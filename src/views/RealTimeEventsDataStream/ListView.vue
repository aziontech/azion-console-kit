<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import Drawer from './Drawer'
  import { computed, ref } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  const emit = defineEmits(['update:dateTime'])

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

  const reloadListTable = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const listProvider = async () => {
    return await props.listDataStream({ tsRange: filterDate.value })
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
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    @on-load-data="handleLoadData"
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
