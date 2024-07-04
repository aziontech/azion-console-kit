<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/action-column.vue'
  import { computed, ref } from 'vue'
  import Drawer from './Drawer'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
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

  const reloadList = () => {
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
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadActivityHistory"
  />
  <div class="flex flex-col gap-8 my-4">
    <div class="flex gap-1">
      <p class="text-xs font-medium leading-4">
        Logs of events from an Azion account regarding activities registered on Activity History.
        Use the Real-Time Events GraphQL API to query up to 2 years of logs.
      </p>
    </div>
    <IntervalFilterBlock
      v-model:filterDate="filterDate"
      @applyTSRange="reloadList"
    />
  </div>
  <ListTableBlock
    v-if="hasContentToList && filterDate.tsRangeBegin"
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No logs have been found for this period."
    isTabs
  />

  <EmptyResultsBlock
    v-else
    title="No logs have been found for this period."
    description="Use the filter to change time range and variables, or use Azion products and services to generate activity."
    :documentationService="documentationService"
    :inTabs="true"
  />
</template>
