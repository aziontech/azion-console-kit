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
    listEdgeFunctions: {
      type: Function,
      required: true
    },
    loadEdgeFunctions: {
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

  const openDetailDrawer = ({ configurationId, ts, requestId }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      configurationId,
      requestId,
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
    return await props.listEdgeFunctions({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'functionLanguage',
        header: 'Function Language'
      },
      {
        field: 'edgeFunctionsInitiatorTypeList',
        header: 'Edge Functions Initiator Type List'
      },
      {
        field: 'edgeFunctionsList',
        header: 'Edge Functions List',
        filterPath: 'edgeFunctionsList',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'edgeFunctionsTime',
        header: 'Edge Functions Time'
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
    :loadService="props.loadEdgeFunctions"
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
