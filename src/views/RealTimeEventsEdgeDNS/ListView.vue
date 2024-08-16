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
    loadEdgeDNS: {
      type: Function,
      required: true
    },
    listEdgeDNS: {
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

  const openDetailDrawer = ({ uuid, ts, source }) => {
    drawerRef.value.openDetailDrawer({
      ...props.filterData,
      uuid,
      source,
      ts
    })
  }

  const reloadListTable = () => {
    listTableBlockRef.value.reload()
  }

  const listProvider = async () => {
    return await props.listEdgeDNS({ ...props.filterData })
  }

  const getColumns = computed(() => {
    return [
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
        field: 'zoneId',
        header: 'Zone ID'
      },
      {
        field: 'qtype',
        header: 'Q Type'
      },
      {
        field: 'resolutionType',
        header: 'Resolution Type'
      },
      {
        field: 'solutionId',
        header: 'Solution ID'
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const customColumnMapper = (rowData) => ({
    level: rowData.data.content
  })

  defineExpose({
    reloadListTable
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadEdgeDNS"
  />
  <ListTableBlock
    lazyLoad
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    emptyListMessage="No logs have been found for this period."
    isTabs
    exportFileName="edge-dns-logs"
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
