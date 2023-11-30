<script setup>
  import ListTableNoHeaderBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import CreateResource from '../drawer/CreateResource.vue'

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

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'content_type',
      header: 'Type'
    },
    {
      field: 'trigger',
      header: 'Trigger'
    },
    {
      field: 'last_editor',
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

  const clearResource = () => {
    resourceID.value
  }
</script>

<template>
  <div class="flex flex-col h-full">
    {{ resourceID }}
    <ListTableNoHeaderBlock
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
      title="No Resource added"
      description="Add the resource that your service needs to run."
      createButtonLabel="Add Resource"
      createPagePath="edge-services/create"
      :documentationService="props.documentationServiceResource"
      :inTabs="true"
    >
      <template #default>
        <PrimeButton
          severity="secondary"
          icon="pi pi-plus"
          label="Add Resource"
          @click="openDrawer"
        />
      </template>
      <template #illustration>
        <Illustration />
      </template>
    </EmptyResultsBlock>
  </div>
  <CreateResource
    v-if="visibleDrawer"
    v-model:visible="visibleDrawer"
    :resourceID="resourceID"
    :edgeServiceID="props.idEdgeService"
    @onSuccess="clearResource"
  />
</template>
