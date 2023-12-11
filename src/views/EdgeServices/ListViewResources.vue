<script setup>
  import ListTableNoHeaderBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import CreateResource from '@/views/EdgeServices/Drawer/CreateResource'

  defineOptions({ name: 'edge-services-view' })

  const props = defineProps({
    idEdgeService: {
      type: String,
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
  const visibleDrawer = ref(false)
  const resourceID = ref()
  const listResources = ref('')

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

  const openDrawer = (item) => {
    resourceID.value = item.id
    visibleDrawer.value = true
  }

  const listResourcesServicesWithDecorator = async (payload) => {
    return await props.listResourcesServices({ ...payload, id: props.idEdgeService })
  }

  const deleteResourcesServicesWithDecorator = async (payload) => {
    return await props.deleteResourcesServices({
      edgeServiceID: props.idEdgeService,
      resourceID: payload
    })
  }

  const reloadList = () => {
    listResources.value.loadData({ page: 1 })
  }
</script>

<template>
  <div class="flex flex-col h-full">
    <ListTableNoHeaderBlock
      ref="listResources"
      v-if="hasContentToList"
      :listService="listResourcesServicesWithDecorator"
      :deleteService="deleteResourcesServicesWithDecorator"
      :columns="getColumns"
      pageTitleDelete="Edge Service Resource"
      :editInDrawer="openDrawer"
      @on-load-data="handleLoadData"
    >
      <template #addButton>
        <PrimeButton
          icon="pi pi-plus"
          label="Resource"
          @click="openDrawer"
        />
      </template>
    </ListTableNoHeaderBlock>
    <EmptyResultsBlock
      v-else
      title="No resources have been created"
      description="Click the button below to initiate the setup process and create the first resource your service should run."
      createButtonLabel="Add"
      createPagePath="edge-services/create"
      :documentationService="props.documentationServiceResource"
      :inTabs="true"
    >
      <template #default>
        <PrimeButton
          severity="secondary"
          icon="pi pi-plus"
          label="Add"
          @click="openDrawer"
        />
      </template>
      <template #illustration>
        <Illustration />
      </template>
    </EmptyResultsBlock>
    <CreateResource
      v-if="visibleDrawer"
      v-model:visible="visibleDrawer"
      :resourceID="resourceID"
      :edgeServiceID="props.idEdgeService"
      @onSuccess="reloadList"
    />
  </div>
</template>
