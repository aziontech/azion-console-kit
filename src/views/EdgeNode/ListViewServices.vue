<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import CreateService from '@/views/EdgeNode/Drawer/CreateService'
  import EditService from '@/views/EdgeNode/Drawer/EditService'

  const props = defineProps({
    edgeNodeId: { type: String, required: true },
    listServiceEdgeNodeService: { type: Function, required: true },
    deleteServiceEdgeNodeService: { type: Function, required: true },
    documentationServiceServices: { type: Function, required: true }
  })

  const hasContentToList = ref(true)
  const visibleDrawerCreate = ref(false)
  const visibleDrawerEdit = ref(false)
  const listServiceEdgeNode = ref('')
  const serviceIdEdgeNode = ref('')

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'status',
      header: 'Status',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
    },
    {
      field: 'lastModified',
      header: 'Last Modified'
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const openCreateServiceDrawer = () => {
    visibleDrawerCreate.value = true
  }

  const openEditServiceDrawer = (item) => {
    serviceIdEdgeNode.value = item.id
    visibleDrawerEdit.value = true
  }

  const listServicesWithDecorator = async (payload) => {
    return await props.listServiceEdgeNodeService({ ...payload, id: props.edgeNodeId, bound: true })
  }

  const deleteServicesWithDecorator = async (payload) => {
    return await props.deleteServiceEdgeNodeService({
      edgeNodeId: props.edgeNodeId,
      serviceId: payload
    })
  }

  const reloadList = () => {
    listServiceEdgeNode.value.loadData({ page: 1 })
  }
</script>

<template>
  <div class="flex flex-col h-full">
    <CreateService
      v-if="visibleDrawerCreate"
      v-model:visible="visibleDrawerCreate"
      :edgeNodeId="props.edgeNodeId"
      @onSuccess="reloadList"
      @onCancel="visibleDrawer = false"
    />
    <EditService
      v-if="visibleDrawerEdit"
      v-model:visible="visibleDrawerEdit"
      :serviceIdEdgeNode="serviceIdEdgeNode"
      :edgeNodeId="props.edgeNodeId"
      @onSuccess="reloadList"
      @onCancel="visibleDrawer = false"
    />
    <ListTableBlock
      ref="listServiceEdgeNode"
      v-if="hasContentToList"
      :listService="listServicesWithDecorator"
      :deleteService="deleteServicesWithDecorator"
      :columns="getColumns"
      createPagePath=""
      addButtonLabel=""
      pageTitleDelete="Edge Node Service"
      :editInDrawer="openEditServiceDrawer"
      @on-load-data="handleLoadData"
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Services"
          @click="openCreateServiceDrawer"
        />
      </template>
    </ListTableBlock>
    <EmptyResultsBlock
      v-else
      title="No Services added."
      description="Create your first Service."
      :documentationService="props.documentationServiceResource"
      :inTabs="true"
    >
      <template #default>
        <PrimeButton
          severity="secondary"
          icon="pi pi-plus"
          label="Service"
          @click="openCreateServiceDrawer"
        />
      </template>
      <template #illustration>
        <Illustration />
      </template>
    </EmptyResultsBlock>
  </div>
</template>
