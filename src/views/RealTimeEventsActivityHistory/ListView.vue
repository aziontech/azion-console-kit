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
    loadActivityHistory: {
      type: Function,
      required: true
    },
    listActivityHistory: {
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

  const openDetailDrawer = ({ userId, ts }) => {
    drawerRef.value.openDetailDrawer({
      ...props.filterData,
      userId,
      ts
    })
  }

  const reloadListTable = () => {
    listTableBlockRef.value.reload()
  }

  const listProvider = async () => {
    return await props.listActivityHistory({ ...props.filterData })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'userIp',
        header: 'User IP'
      },
      {
        field: 'authorName',
        header: 'Author Name'
      },
      {
        field: 'title',
        header: 'Title',
        type: 'component',
        filterPath: 'title',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'resourceType',
        header: 'Resource Type'
      },
      {
        field: 'resourceId',
        header: 'Resource ID'
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const customColumnMapper = (rowData) => ({
    title: rowData.data.text
  })

  defineExpose({
    reloadListTable
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadActivityHistory"
  />
  <ListTableBlock
    lazyLoad
    isTabs
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    emptyListMessage="No logs have been found for this period."
    :csvMapper="customColumnMapper"
    exportFileName="activity-history-logs"
  >
    <template #header="{ exportTableCSV }">
      <slot
        name="header"
        :downloadCSV="exportTableCSV"
      />
    </template>
  </ListTableBlock>
</template>
