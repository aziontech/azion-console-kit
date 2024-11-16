<script setup>
  import EmptyResultsBlock from '@templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import Drawer from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({
    name: 'edge-firewall-rules-engine-list-view'
  })

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    createEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },
    editEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },
    listEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },
    deleteEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },
    loadEdgeFirewallRulesEngineService: {
      type: Function,
      required: true
    },
    listFunctionsService: {
      type: Function,
      required: true
    },
    listWafRulesService: {
      type: Function,
      required: true
    },
    edgeFirewallId: {
      type: Number || String,
      required: true
    },
    edgeFirewallModules: {
      type: Object,
      required: true
    },
    listNetworkListService: {
      type: Function,
      required: true
    },
    reorderEdgeFirewallRulesEngine: {
      type: Function,
      required: true
    }
  })
  const hasContentToList = ref(true)
  const drawerRef = ref('')
  const listTableBlockRef = ref('')
  const EDGE_FIREWALL_RULES_ENGINE_API_FIELDS = [
    'id',
    'name',
    'description',
    'last_modified',
    'last_editor',
    'is_active'
  ]

  const listEdgeFirewallRulesEngineServiceWithDecorator = async (query) => {
    return await props.listEdgeFirewallRulesEngineService({
      edgeFirewallId: props.edgeFirewallId,
      ...query
    })
  }
  const deleteEdgeFirewallRulesEngineServiceWithDecorator = async (ruleEngineId) => {
    return await props.deleteEdgeFirewallRulesEngineService({
      edgeFirewallId: props.edgeFirewallId,
      ruleEngineId
    })
  }

  const reorderRulesEngineWithDecorator = async (
    newOrderData,
    currentOrderData,
    ordering,
    search
  ) => {
    return props.reorderEdgeFirewallRulesEngine(
      newOrderData,
      currentOrderData,
      props.edgeFirewallId,
      ordering,
      search
    )
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Rules Engine'
    })
  }

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Rules Engine'
    })
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const openCreateDrawer = () => {
    handleCreateTrackEvent()
    drawerRef.value.openCreateDrawer()
  }
  const openEditDrawer = (item) => {
    drawerRef.value.openEditDrawer(item.id)
  }
  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      disableSort: true
    },
    {
      field: 'status',
      header: 'Status',
      sortField: 'status.content',
      filterPath: 'status.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      },
      disableSort: true
    },
    {
      field: 'description',
      header: 'Description',
      filterPath: 'description.value',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' }),
      disableSort: true
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      disableSort: true
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      disableSort: true
    }
  ])

  const actions = [
    {
      type: 'delete',
      title: 'rule',
      icon: 'pi pi-trash',
      service: deleteEdgeFirewallRulesEngineServiceWithDecorator
    }
  ]
</script>
<template>
  <Drawer
    ref="drawerRef"
    :edgeFirewallId="edgeFirewallId"
    :edgeFirewallModules="edgeFirewallModules"
    :createService="createEdgeFirewallRulesEngineService"
    :listFunctionsService="listFunctionsService"
    :listWafRulesService="listWafRulesService"
    :loadService="loadEdgeFirewallRulesEngineService"
    :editService="editEdgeFirewallRulesEngineService"
    :listNetworkListService="listNetworkListService"
    @onSuccess="reloadList"
  />

  <FetchListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    :reorderableRows="true"
    :listService="listEdgeFirewallRulesEngineServiceWithDecorator"
    :onReorderService="reorderRulesEngineWithDecorator"
    :columns="getColumns"
    :editInDrawer="openEditDrawer"
    @on-load-data="handleLoadData"
    @on-before-go-to-edit="handleTrackEditEvent"
    emptyListMessage="No rules found."
    addButtonLabel="Rules Engine"
    :actions="actions"
    isTabs
    :apiFields="EDGE_FIREWALL_RULES_ENGINE_API_FIELDS"
    :defaultOrderingFieldName="''"
  >
    <template #addButton>
      <PrimeButton
        icon="pi pi-plus"
        label="Rule"
        @click="openCreateDrawer"
      />
    </template>
  </FetchListTableBlock>
  <EmptyResultsBlock
    v-else
    title="No rule has been created"
    description="Click the button below to create your first rule."
    createButtonLabel="Rule"
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Rules Engine"
        data-testid="create_Rules Engine_button"
        @click="openCreateDrawer"
      />
    </template>
  </EmptyResultsBlock>
</template>
