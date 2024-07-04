<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import Drawer from './Drawer'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import { useRouter } from 'vue-router'
  const emit = defineEmits(['update:dateTime'])
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
  const router = useRouter()
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

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const listProvider = async () => {
    return await props.listHttpRequest({ tsRange: filterDate.value })
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

  const goToCreateEdgeApplication = () => {
    router.push({ name: 'create-edge-application', query: { origin: 'realTimeEvents' } })
  }

  const goToCreateWAF = () => {
    router.push({ name: 'create-waf-rules' })
  }
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadHttpRequest"
  />
  <div class="flex flex-col gap-8 my-4">
    <div class="flex gap-1">
      <p class="text-xs font-medium leading-4">
        Logs of events from requests made to your edge applications and edge firewalls.
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
    description="Use the filter to change time range and variables, or create a new edge application or edge firewall with a WAF. Logs are displayed once there are incoming requests and traffic."
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Edge Application"
        @click="goToCreateEdgeApplication"
      />
    </template>
    <template #extraActionsRight>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="WAF"
        @click="goToCreateWAF"
      />
    </template>
  </EmptyResultsBlock>
</template>
