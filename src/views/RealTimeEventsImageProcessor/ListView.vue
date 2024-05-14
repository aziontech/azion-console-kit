<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import Drawer from './Drawer'
  import { useRouter } from 'vue-router'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
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

  const openDetailDrawer = ({ configurationId, ts, httpUserAgent, httpReferer }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      configurationId,
      httpReferer,
      httpUserAgent,
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
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'host',
        header: 'Host'
      },
      {
        field: 'requestUri',
        header: 'Request Uri',
        type: 'component',
        filterPath: 'requestUri',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'status',
        header: 'Status'
      },
      {
        field: 'bytesSent',
        header: 'Bytes Sent'
      },
      {
        field: 'tsFormat',
        header: 'TS'
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
      <p class="text-xs font-medium leading-4">
        Logs of events from requests made to edge applications that processed images with Image
        Processor.
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
  />

  <EmptyResultsBlock
    v-else
    title="No logs have been found for this period."
    description="Use the filter to change time range and variables, or create a new edge application with Image Processor configurations. Logs are displayed once there are incoming requests and traffic."
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
