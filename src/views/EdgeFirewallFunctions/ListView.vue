<script setup>
  import { computed, ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { edgeFirewallFunctionService } from '@/services/v2/edge-firewall/edge-firewall-function-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { openDocumentationProducts } from '@/helpers/azion-documentation-window-opener'
  import DrawerFunction from './Drawer'

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
  const documentationService = () => {
    openDocumentationProducts('/secure/firewall/functions-instances/')
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: columnStyles.priority(2, 200, 350),
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
        filterPath: 'id',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'functionInstanced',
        header: 'Function',
        sortField: 'edge_function',
        disableSort: true,
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor',
        style: COLUMN_STYLES.PRIORITY_SM
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified',
        style: COLUMN_STYLES.FIT_CONTENT
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
  defineExpose({
    openCreateDrawer: openCreateFunctionDrawer
  })
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
    :frozen-columns="['name']"
    exportFileName="Firewall Functions"
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
