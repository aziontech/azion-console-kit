<script setup>
  import ListTable from '@/components/list-table/ListTable.vue'
  import DrawerResource from '@/views/EdgeServices/Drawer'
  import PrimeButton from '@aziontech/webkit/button'
  import { computed, ref } from 'vue'

  defineOptions({ name: 'list-edge-service-resources-tab' })

  const props = defineProps({
    edgeServiceId: {
      type: String,
      required: true
    },
    createResourcesServices: {
      type: Function,
      required: true
    },
    loadResourcesServices: {
      type: Function,
      required: true
    },
    editResourcesServices: {
      type: Function,
      required: true
    },
    listResourcesServices: {
      type: Function,
      required: true
    },
    deleteResourcesServices: {
      type: Function,
      required: true
    },
    documentationServiceResource: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)
  const drawerResourceRef = ref('')
  const listTableRef = ref(null)

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'contentType',
      header: 'Type'
    },
    {
      field: 'trigger',
      header: 'Trigger'
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
  ])

  const openCreateServiceDrawer = () => {
    drawerResourceRef.value.openDrawerCreate()
  }

  const openEditServiceDrawer = (item) => {
    drawerResourceRef.value.openDrawerEdit(item.id)
  }

  const listResourcesServicesWithDecorator = async (payload) => {
    return await props.listResourcesServices({ ...payload, id: props.edgeServiceId })
  }

  const deleteResourcesServicesWithDecorator = async (id) => {
    return await props.deleteResourcesServices({
      edgeServiceId: props.edgeServiceId,
      id
    })
  }

  const actions = [
    {
      type: 'delete',
      label: 'Delete',
      title: 'resource',
      icon: 'pi pi-trash',
      service: deleteResourcesServicesWithDecorator
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const reloadResourcesList = () => {
    if (hasContentToList.value) {
      listTableRef.value?.reload()
      return
    }
    hasContentToList.value = true
  }

  defineExpose({
    openCreateDrawer: openCreateServiceDrawer
  })
</script>

<template>
  <div class="flex flex-col h-full">
    <DrawerResource
      ref="drawerResourceRef"
      :edgeServiceId="props.edgeServiceId"
      :createResourcesServices="props.createResourcesServices"
      :loadResourcesServices="props.loadResourcesServices"
      :editResourcesServices="props.editResourcesServices"
      @onSuccess="reloadResourcesList"
    />
    <ListTable
      ref="listTableRef"
      :listService="listResourcesServicesWithDecorator"
      :columns="getColumns"
      :editInDrawer="openEditServiceDrawer"
      :actions="actions"
      exportFileName="Resources"
      :lazy="true"
      :isTabs="true"
      emptyListMessage="No resources found."
      :emptyBlock="{
        title: 'No resources yet',
        description: 'Create your first resource to enable your service to run at the edge.',
        createButtonLabel: 'Resource',
        documentationService: props.documentationServiceResource
      }"
      @on-load-data="handleLoadData"
    >
      <template #header-actions>
        <PrimeButton
          icon="pi pi-plus"
          label="Resource"
          @click="openCreateServiceDrawer"
          data-testid="edge-service-resources-list__create-resource-button"
        />
      </template>
      <template #emptyBlockButton>
        <PrimeButton
          class="max-md:w-full w-fit"
          severity="secondary"
          icon="pi pi-plus"
          label="Resource"
          @click="openCreateServiceDrawer"
          data-testid="list-table-block__create-resource-button"
        />
      </template>
    </ListTable>
  </div>
</template>
