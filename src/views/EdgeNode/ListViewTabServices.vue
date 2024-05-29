<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import DrawerService from '@/views/EdgeNode/Drawer'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  defineOptions({ name: 'list-edge-node-resources-tab' })

  const props = defineProps({
    edgeNodeId: { type: String, required: true },
    createServiceEdgeNodeService: { type: Function, required: true },
    editServiceEdgeNodeService: { type: Function, required: true },
    loadServiceEdgeNodeService: { type: Function, required: true },
    listServiceEdgeNodeService: { type: Function, required: true },
    deleteServiceEdgeNodeService: { type: Function, required: true },
    documentationServiceServices: { type: Function, required: true }
  })

  const hasContentToList = ref(true)
  const listServiceEdgeNodeRef = ref('')
  const drawerServiceRef = ref('')

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
    drawerServiceRef.value.openDrawerCreate()
  }

  const openEditServiceDrawer = (item) => {
    drawerServiceRef.value.openDrawerEdit(item.id)
  }

  const listServicesWithDecorator = async (payload) => {
    return await props.listServiceEdgeNodeService({
      ...payload,
      edgeNodeId: props.edgeNodeId,
      bound: true
    })
  }

  const deleteServicesWithDecorator = async (id) => {
    return await props.deleteServiceEdgeNodeService({
      edgeNodeId: props.edgeNodeId,
      id
    })
  }

  const reloadServicesList = () => {
    if (hasContentToList.value) {
      listServiceEdgeNodeRef.value.reload()
      return
    }
    hasContentToList.value = true
  }
</script>

<template>
  <div class="flex flex-col h-full">
    <DrawerService
      ref="drawerServiceRef"
      :edgeNodeId="props.edgeNodeId"
      :listServiceEdgeNodeService="props.listServiceEdgeNodeService"
      :createServiceEdgeNodeService="props.createServiceEdgeNodeService"
      :editServiceEdgeNodeService="props.editServiceEdgeNodeService"
      :loadServiceEdgeNodeService="props.loadServiceEdgeNodeService"
      @onSuccess="reloadServicesList"
    />
    <div v-if="hasContentToList">
      <ListTableBlock
        ref="listServiceEdgeNodeRef"
        :listService="listServicesWithDecorator"
        :deleteService="deleteServicesWithDecorator"
        :columns="getColumns"
        pageTitleDelete="service"
        :editInDrawer="openEditServiceDrawer"
        @on-load-data="handleLoadData"
        emptyListMessage="No services found."
      >
        <template #addButton>
          <PrimeButton
            icon="pi pi-plus"
            label="Service"
            @click="openCreateServiceDrawer"
          />
        </template>
      </ListTableBlock>
    </div>
    <EmptyResultsBlock
      v-else
      title="No services have been provisioned"
      description="Click the button below to provision your first service."
      :documentationService="props.documentationServiceServices"
      :inTabs="true"
    >
      <template #default>
        <PrimeButton
          class="max-md:w-full w-fit"
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
