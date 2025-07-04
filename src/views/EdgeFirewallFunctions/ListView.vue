<template>
  <DrawerFunction
    ref="drawerFunctionRef"
    :edgeFirewallID="props.edgeFirewallID"
    :createFunctionService="props.createFunctionService"
    :loadFunctionService="props.loadFunctionService"
    :editFunctionService="props.editFunctionService"
    :listEdgeFunctionsService="listEdgeFunctionsService"
    :loadEdgeFunctionService="loadEdgeFunctionService"
    @onSuccess="reloadList"
  />
  <div v-if="hasContentToList">
    <FetchListTableBlock
      ref="listFunctionsEdgeFirewallRef"
      addButtonLabel="Function Instance"
      :listService="listFunctionsInstance"
      :columns="getColumns"
      :editInDrawer="openEditFunctionDrawer"
      @on-load-data="handleLoadData"
      :actions="actions"
      isTabs
      :apiFields="EDGE_FIREWALL_FUNCTIONS_API_FIELDS"
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Function Instance"
          @click="openCreateFunctionDrawer"
        />
      </template>
    </FetchListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No functions have been instantiated"
    description="Click the button below to instantiate your first edge function."
    createButtonLabel="Function Instance"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Function Instance"
        data-testid="create_Function Instance_button"
        @click="openCreateFunctionDrawer"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import DrawerFunction from './Drawer'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { edgeFirewallFunctionService } from '@/services/v2'

  import { computed, ref } from 'vue'

  defineOptions({ name: 'list-edge-applications-functions-tab' })

  const hasContentToList = ref(true)

  const props = defineProps({
    edgeFirewallID: {
      required: true,
      type: String
    },
    loadFunctionService: {
      required: true,
      type: Function
    },
    listEdgeFunctionsService: {
      required: true,
      type: Function
    },
    loadEdgeFunctionService: {
      required: true,
      type: Function
    },
    createFunctionService: {
      required: true,
      type: Function
    },
    editFunctionService: {
      required: true,
      type: Function
    },
    deleteFunctionService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const drawerFunctionRef = ref('')
  const listFunctionsEdgeFirewallRef = ref('')
  const EDGE_FIREWALL_FUNCTIONS_API_FIELDS = [
    'id',
    'name',
    'last_editor',
    'last_modified',
    'version',
    'edge_function'
  ]

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'functionInstanced',
        header: 'Edge Function',
        sortField: 'edge_function',
        disableSort: true
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor'
      },
      {
        field: 'modified',
        header: 'Last Modified',
        sortField: 'last_modified'
      }
    ]
  })

  const listFunctionsInstance = async (query) => {
    return await edgeFirewallFunctionService.listEdgeFirewallFunctionsService(
      props.edgeFirewallID,
      query
    )
  }

  const deleteFunctionsWithDecorator = async (functionId) => {
    return await edgeFirewallFunctionService.deleteEdgeFirewallFunctionService(
      functionId,
      props.edgeFirewallID
    )
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const openCreateFunctionDrawer = () => {
    drawerFunctionRef.value.openDrawerCreate()
  }

  const openEditFunctionDrawer = (data) => {
    drawerFunctionRef.value.openDrawerEdit(data.id)
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listFunctionsEdgeFirewallRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const actions = [
    {
      type: 'delete',
      title: 'function instance',
      icon: 'pi pi-trash',
      service: deleteFunctionsWithDecorator
    }
  ]
</script>
