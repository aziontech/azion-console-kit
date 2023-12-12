<script setup>
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers'
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import DrawerResource from '@/views/EdgeServices/Drawer'

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
        :deleteService="deleteResourcesServicesWithDecorator"
        :columns="getColumns"
        pageTitleDelete="Resource"
        :editInDrawer="openEditServiceDrawer"
        @on-load-data="handleLoadData"
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
      description="Click the button below to initiate the setup process and create a resource for the service to run."
      createButtonLabel="Add"
      :documentationService="props.documentationServiceResource"
      :inTabs="true"
    >
      <template #default>
        <PrimeButton
          severity="secondary"
          icon="pi pi-plus"
          label="Add"
          @click="openCreateServiceDrawer"
        />
      </template>
      <template #illustration>
        <Illustration />
      </template>
    </EmptyResultsBlock>
  </div>
</template>
