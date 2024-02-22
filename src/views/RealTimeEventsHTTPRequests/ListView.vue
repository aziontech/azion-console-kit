<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import Drawer from './Drawer'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import { useRouter } from 'vue-router'

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
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const filterDate = ref({})
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
        field: 'bytesSent',
        header: 'Bytes Sent'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'debugLog',
        header: 'Debug log'
      },
      {
        field: 'geolocAsn',
        header: 'Geoloc ASN'
      },
      {
        field: 'geolocCountryName',
        header: 'Geloc Country Name'
      },
      {
        field: 'geolocRegionName',
        header: 'Geoloc Region Name'
      }
    ]
  })

  const goToCreateEdgeApplication = () => {
    router.push({ name: 'create-edge-application' })
  }

  const goToCreateWAF = () => {
    router.push({ name: 'create-waf-rules' })
  }
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadHttpRequest"
    :clipboardWrite="props.clipboardWrite"
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
    v-if="hasContentToList"
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
    description="Change the time range to search other logs or create new Edge Applications or configure WAFs. They are displayed when there are requests and traffic received in the period selected."
    createButtonLabel="create button label"
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #extraActionsLeft>
      <PrimeButton
        severity="primary"
        outlined
        icon="pi pi-shopping-cart"
        label="Browser Template"
        @click="() => {}"
      />
    </template>
    <template #default>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="Edge Application"
        @click="goToCreateEdgeApplication"
      />
    </template>
    <template #extraActionsRight>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="WAF"
        @click="goToCreateWAF"
      />
    </template>
  </EmptyResultsBlock>
</template>
