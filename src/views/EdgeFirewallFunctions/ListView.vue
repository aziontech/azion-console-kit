<template>
  <DrawerFunction
    ref="drawerFunctionRef"
    :edgeFirewallID="props.edgeFirewallID"
    :createFunctionService="props.createFunctionService"
    :listEdgeFunctionsService="props.listEdgeFunctionsService"
    :loadFunctionService="props.loadFunctionService"
    :editFunctionService="props.editFunctionService"
    @onSuccess="reloadList"
  />
  <div v-if="hasContentToList">
    <ListTableBlock
      ref="listFunctionsEdgeFirewallRef"
      :listService="listFunctionsInstance"
      :deleteService="deleteFunctionsWithDecorator"
      :columns="getColumns"
      :editInDrawer="openEditFunctionDrawer"
      pageTitleDelete="function instance"
      @on-load-data="handleLoadData"
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Function Instance"
          @click="openCreateFunctionDrawer"
        />
      </template>
    </ListTableBlock>
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
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import DrawerFunction from './Drawer'
  import { computed, ref } from 'vue'

  defineOptions({ name: 'list-edge-applications-functions-tab' })

  const hasContentToList = ref(true)

  const props = defineProps({
    edgeFirewallID: {
      required: true,
      type: String
    },
    listEdgeFunctionsService: {
      required: true,
      type: Function
    },
    listEdgeFirewallFunctionService: {
      required: true,
      type: Function
    },
    loadFunctionService: {
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

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'functionInstanced',
        header: 'Function Instanced'
      },
      {
        field: 'version',
        header: 'Version'
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'modified',
        sortField: 'lastModifiedDate',
        header: 'Last Modified'
      }
    ]
  })

  const listFunctionsInstance = async () => {
    return await props.listEdgeFirewallFunctionService(props.edgeFirewallID)
  }

  const deleteFunctionsWithDecorator = async (functionId) => {
    return await props.deleteFunctionService(functionId, props.edgeFirewallID)
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
</script>
