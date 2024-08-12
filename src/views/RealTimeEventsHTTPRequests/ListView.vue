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

  const hasContentToList = ref(true)
  const listTableBlockRef = ref('')
  const drawerRef = ref('')

  const openDetailDrawer = ({ configurationId, ts, requestId }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: props.filterData.tsRange,
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
    return await props.listHttpRequest({ tsRange: props.filterData.tsRange })
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
