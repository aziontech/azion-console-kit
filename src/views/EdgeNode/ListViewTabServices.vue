<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table/ListTable.vue'
  import DrawerService from '@/views/EdgeNode/Drawer'
  import PrimeButton from '@aziontech/webkit/button'
  import { computed, ref } from 'vue'
  import UnbindDialog from '@/views/EdgeNode/Dialog/Unbind'
  import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'

  defineOptions({ name: 'list-edge-node-resources-tab' })

  const props = defineProps({
    edgeNodeId: { type: String, required: true },
    listServiceEdgeNodeService: { type: Function, required: true },
    documentationServiceServices: { type: Function, required: true }
  })

  const hasContentToList = ref(true)
  const drawerServiceRef = ref('')
  const listTableRef = ref(null)

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'status',
      header: 'Status',
      sortField: 'status.content',
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
    return await edgeNodeService.listEdgeNodeServicesService(props.edgeNodeId, payload)
  }

  const unbindServicesWithDecorator = async (id) => {
    return await edgeNodeService.deleteEdgeNodeServiceService({
      edgeNodeId: props.edgeNodeId,
      id
    })
  }

  const actions = [
    {
      type: 'dialog',
      icon: 'pi pi-trash',
      label: 'Unbind',
      dialog: {
        component: UnbindDialog,
        body: (item) => ({
          data: {
            title: 'edge service',
            parent: 'edge node',
            selectedID: item.id,
            service: unbindServicesWithDecorator
          },
          onClose: (opt) => opt.data.updated && reloadServicesList()
        })
      }
    }
  ]

  const reloadServicesList = () => {
    edgeNodeService.invalidateEdgeNodeServicesCache(props.edgeNodeId)
    if (hasContentToList.value) {
      listTableRef.value?.reload()
      return
    }
    hasContentToList.value = true
  }
</script>

<template>
  <div class="flex flex-col h-full">
    <DrawerService
      ref="drawerServiceRef"
      :edgeNodeId="edgeNodeId"
      :listServiceEdgeNodeService="listServiceEdgeNodeService"
      @onSuccess="reloadServicesList"
    />
    <div v-if="hasContentToList">
      <ListTable
        ref="listTableRef"
        :listService="listServicesWithDecorator"
        :columns="getColumns"
        :editInDrawer="openEditServiceDrawer"
        :actions="actions"
        editPagePath="/"
        createPagePath="/"
        exportFileName="Edge Node Services"
        emptyListMessage="No services found."
        :isTabs="true"
        @on-load-data="handleLoadData"
      >
        <template #header-actions>
          <PrimeButton
            icon="pi pi-plus"
            label="Service"
            @click="openCreateServiceDrawer"
          />
        </template>
      </ListTable>
    </div>
    <EmptyResultsBlock
      v-else
      title="No services have been provisioned"
      description="Click the button below to provision your first service."
      :documentationService="documentationServiceServices"
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
