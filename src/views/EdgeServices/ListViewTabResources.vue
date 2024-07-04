<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/action-column.vue'
  import DrawerResource from '@/views/EdgeServices/Drawer'
  import PrimeButton from 'primevue/button'
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
  const listResourcesEdgeServiceRef = ref('')
  const drawerResourceRef = ref('')

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

  const reloadResourcesList = () => {
    if (hasContentToList.value) {
      listResourcesEdgeServiceRef.value.reload()
      return
    }
    hasContentToList.value = true
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
    <div v-if="hasContentToList">
      <ListTableBlock
        ref="listResourcesEdgeServiceRef"
        :listService="listResourcesServicesWithDecorator"
        :columns="getColumns"
        :editInDrawer="openEditServiceDrawer"
        @on-load-data="handleLoadData"
        emptyListMessage="No resources found."
        :actions="actions"
        isTabs
      >
        <template #addButton>
          <PrimeButton
            icon="pi pi-plus"
            label="Resource"
            @click="openCreateServiceDrawer"
          />
        </template>
      </ListTableBlock>
    </div>
    <EmptyResultsBlock
      v-else
      title="No resources have been created"
      description="Click the button below to create a resource for the service to run."
      createButtonLabel="Resource"
      :documentationService="props.documentationServiceResource"
      :inTabs="true"
    >
      <template #default>
        <PrimeButton
          class="max-md:w-full w-fit"
          severity="secondary"
          icon="pi pi-plus"
          label="Resource"
          @click="openCreateServiceDrawer"
        />
      </template>
      <template #illustration>
        <Illustration />
      </template>
    </EmptyResultsBlock>
  </div>
</template>
