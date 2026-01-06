<script setup>
  import { computed, ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { edgeFirewallFunctionService } from '@/services/v2/edge-firewall/edge-firewall-function-service'
  import DrawerFunction from './Drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { openDocumentationProducts } from '@/helpers/azion-documentation-window-opener'

  defineOptions({ name: 'list-edge-applications-functions-tab' })

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
    }
  })

  const router = useRouter()
  const route = useRoute()
  const drawerFunctionRef = ref('')
  const listFunctionsEdgeFirewallRef = ref('')
  const EDGE_FIREWALL_FUNCTIONS_API_FIELDS = [
    'id',
    'name',
    'last_editor',
    'last_modified',
    'version',
    'function'
  ]

  const documentationService = () => {
    openDocumentationProducts('/secure/firewall/functions-instances/')
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
      },
      {
        field: 'functionInstanced',
        header: 'Function',
        sortField: 'edge_function',
        disableSort: true
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor'
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified'
      }
    ]
  })

  const listFunctionsInstance = async (query) => {
    const data = await edgeFirewallFunctionService.listEdgeFirewallFunctionsService(
      props.edgeFirewallID,
      query
    )
    return data
  }

  const deleteFunctionsWithDecorator = async (functionId) => {
    return await edgeFirewallFunctionService.deleteEdgeFirewallFunctionService(
      functionId,
      props.edgeFirewallID
    )
  }

  const openCreateFunctionDrawer = () => {
    drawerFunctionRef.value.openDrawerCreate()
  }

  const openEditFunctionDrawer = (data) => {
    openDrawer({ id: data.id })
    router.push({
      query: {
        id: data.id
      }
    })
  }

  const openDrawerById = (data) => {
    openDrawer({ id: data.id })
  }

  const openDrawer = (data) => {
    drawerFunctionRef.value.openDrawerEdit(data.id)
  }

  const reloadList = () => {
    listFunctionsEdgeFirewallRef.value.reload()
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'function instance',
      icon: 'pi pi-trash',
      service: deleteFunctionsWithDecorator
    }
  ]

  onMounted(() => {
    openDrawerById({ id: route.query.id })
  })
</script>

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
  <FetchListTableBlock
    ref="listFunctionsEdgeFirewallRef"
    addButtonLabel="Function Instance"
    :listService="listFunctionsInstance"
    :columns="getColumns"
    :editInDrawer="openEditFunctionDrawer"
    :actions="actions"
    isTabs
    :apiFields="EDGE_FIREWALL_FUNCTIONS_API_FIELDS"
    :frozen-columns="['name']"
    exportFileName="Edge Firewall Functions"
    :emptyBlock="{
      title: 'No Functions have been instantiated',
      description: 'Click the button below to instantiate your first Function.',
      createButtonLabel: 'Function Instance',
      documentationService: documentationService
    }"
  >
    <template #addButton>
      <PrimeButton
        icon="pi pi-plus"
        label="Function Instance"
        @click="openCreateFunctionDrawer"
      />
    </template>
    <template #emptyBlockButton>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Function Instance"
        data-testid="create_Function Instance_button"
        @click="openCreateFunctionDrawer"
      />
    </template>
  </FetchListTableBlock>
</template>
