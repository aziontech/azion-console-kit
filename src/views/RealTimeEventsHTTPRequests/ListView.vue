<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  // import Drawer from './Drawer'

  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)
  const listTableBlockRef = ref('')

  // const drawerRef = ref('')

  const listServiceMock = async () => {
    return [
      {
        id: 1,
        bytesSent: 191,
        configurationId: '1595368520',
        debugLog: `{"edge_firewall":["Global - Set WAF"]}`,
        asn: 'AS52580 Azion Technologies Ltda.',
        country: 'United States',
        region: 'California'
      },
      {
        id: 2,
        bytesSent: 192,
        configurationId: '1595368521',
        debugLog: `{"edge_firewall":["Global - Set WAF"]}`,
        asn: 'AS52580 Azion Technologies Ltda.',
        country: 'Germany',
        region: 'Berlim'
      },
      {
        id: 3,
        bytesSent: 193,
        configurationId: '1595368522',
        debugLog: `{"edge_firewall":["Global - Set WAF"]}`,
        asn: 'AS52580 Azion Technologies Ltda.',
        country: 'Brazil',
        region: 'Porto Alegre'
      }
    ]
    // return await props.listRealTimeEventsHttpRequestsService({time:15})
  }

  // const openCreateDrawer = () => {
  //   drawerRef.value.openCreateDrawer()
  // }
  // const openEditDrawer = (item) => {
  //   drawerRef.value.openEditDrawer(item.id)
  // }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  // const reloadList = () => {
  //   if (hasContentToList.value) {
  //     listTableBlockRef.value.reload()
  //     return
  //   }
  //   hasContentToList.value = true
  // }

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
        field: 'asn',
        header: 'Geoloc ASN'
      },
      {
        field: 'country',
        header: 'Geloc Country Name'
      },
      {
        field: 'region',
        header: 'Geoloc Region Name'
      }
    ]
  })
</script>

<template>
  <ListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    :listService="listServiceMock"
    :columns="getColumns"
    :editInDrawer="openEditDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No events found"
  >
  </ListTableBlock>

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
        @click="
          () => {
            console.log('ir para templates')
          }
        "
      />
    </template>
    <template #default>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="Edge Application"
        @click="openCreateDrawer"
      />
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="WAF"
        @click="openCreateDrawer"
      />
    </template>
  </EmptyResultsBlock>
</template>
