<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import Drawer from './Drawer'
  import { useRouter } from 'vue-router'
  const emit = defineEmits(['update:dateTime'])

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    listImageProcessor: {
      type: Function,
      required: true
    },
    loadImageProcessor: {
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
  const router = useRouter()
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

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const listProvider = async () => {
    return await props.listImageProcessor({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'bytesSent',
        header: 'Bytes Sent'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'host',
        header: 'Host'
      },
      {
        field: 'httpReferer',
        header: 'HTTP Referrer'
      },
      {
        field: 'httpUserAgent',
        header: 'HTTP Agent'
      },
      {
        field: 'referenceError',
        header: 'Reference Error'
      }
    ]
  })

  const goToEdgeApplication = () => {
    router.push({ name: 'list-edge-applications' })
  }
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadImageProcessor"
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
    description="Change the time range to search other logs or create new Edge Function. They are displayed when there are requests and traffic received in the period selected."
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        severity="secondary"
        label="Edge Application"
        @click="goToEdgeApplication"
      />
    </template>
  </EmptyResultsBlock>
</template>
