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
    listEdgeFunctionsConsole: {
      type: Function,
      required: true
    },
    loadEdgeFunctionsConsole: {
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

  const openDetailDrawer = ({ configurationId, ts, source, line, originalId }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      configurationId,
      source,
      id: originalId,
      ts,
      line
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
    return await props.listEdgeFunctionsConsole({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'functionId',
        header: 'Function Id'
      },
      {
        field: 'lineSource',
        header: 'Line Source',
        filterPath: 'lineSource.content',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
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
        field: 'line',
        header: 'Line',
        type: 'component',
        filterPath: 'line',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
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
    :loadService="props.loadEdgeFunctionsConsole"
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
