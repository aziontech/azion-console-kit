<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import { computed, ref } from 'vue'
  import Drawer from './Drawer'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
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
        field: 'accountId',
        header: 'Account ID'
      },
      {
        field: 'authorEmail',
        header: 'Author E-mail'
      },
      {
        field: 'authorName',
        header: 'Author Name'
      },
      {
        field: 'userId',
        header: 'User ID'
      },
      {
        field: 'title',
        header: 'Title'
      },
      {
        field: 'comment',
        header: 'Comment'
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
      <p class="text-xs font-medium leading-4">Specification</p>
      <p class="text-xs font-normal leading-4">description here in english about this view</p>
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
    emptyListMessage="No events found in this search."
  />

  <EmptyResultsBlock
    v-else
    title="No events found in this period."
    description="Change the time range to search other logs or start using services and products to view your account's activity.
They are displayed when there are requests and traffic received in the period selected."
    :documentationService="documentationService"
    :inTabs="true"
  />
</template>
