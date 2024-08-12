<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import { computed, ref } from 'vue'
  import Drawer from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  const emit = defineEmits(['update:dateTime'])

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

  const openDetailDrawer = ({ userId, ts }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      userId,
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
    return await props.listActivityHistory({ tsRange: filterDate.value })
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
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No logs have been found for this period."
    isTabs
  >
    <template #header>
      <slot />
    </template>
  </ListTableBlock>
</template>
