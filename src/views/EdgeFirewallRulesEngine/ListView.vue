<script setup>
  import EmptyResultsBlock from '@templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import ListTableBlock from '@/templates/list-table-block/index.vue'
  import Drawer from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref } from 'vue'

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

  const listEdgeFirewallRulesEngineServiceWithDecorator = async () => {
    return await props.listEdgeFirewallRulesEngineService({ edgeFirewallId: props.edgeFirewallId })
  }
  const deleteEdgeFirewallRulesEngineServiceWithDecorator = async (ruleEngineId) => {
    return await props.deleteEdgeFirewallRulesEngineService({
      edgeFirewallId: props.edgeFirewallId,
      ruleEngineId
    })
  }

  const reorderRulesEngineWithDecorator = async (tableData) => {
    return props.reorderEdgeFirewallRulesEngine(tableData, props.edgeFirewallId)
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const openCreateDrawer = () => {
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
      header: 'Name'
    },
    {
      field: 'status',
      header: 'Status',
      filterPath: 'status.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'description',
      header: 'Description',
      filterPath: 'description.value',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
    },
    {
      field: 'lastModified',
      header: 'Last Modified'
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
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

  <ListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    :reorderableRows="true"
    :listService="listEdgeFirewallRulesEngineServiceWithDecorator"
    :onReorderService="reorderRulesEngineWithDecorator"
    :columns="getColumns"
    :editInDrawer="openEditDrawer"
    :isReorderAllEnabled="true"
    @on-load-data="handleLoadData"
    emptyListMessage="No rules have been created."
    :actions="actions"
    isTabs
  >
    <template #addButton>
      <PrimeButton
        icon="pi pi-plus"
        label="Rule"
        @click="openCreateDrawer"
      />
    </template>
  </ListTableBlock>
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
        @click="openCreateDrawer"
      />
    </template>
  </EmptyResultsBlock>
</template>
