<script setup>
  import ListTableBlock from '@/templates/list-table-block/no-header.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import CreateResource from './drawer/CreateResource.vue'

  defineOptions({ name: 'edge-services-view' })

  const props = defineProps({
    listService: {
      type: Function,
      required: true
    },
    deleteService: {
      type: Function,
      required: true
    },
    editService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)
  const visibleDrawer = ref(false)

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
    },
    {
      field: 'lastModified',
      sortField: 'lastModifiedDate',
      header: 'Last Modified'
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
  const openDrawer = () => {
    visibleDrawer.value = true
  }
</script>

<template>
  <ListTableBlock
    v-if="!hasContentToList"
    :listService="props.listService"
    :deleteService="props.deleteService"
    :columns="getColumns"
    pageTitleDelete="Edge Service"
    addButtonLabel="Edge Services"
    createPagePath="edge-services/create"
    editPagePath="edge-services/edit"
    @on-load-data="handleLoadData"
  />

  <EmptyResultsBlock
    v-else
    title="No Resource added"
    description="Lorem ipsum dolor sit amet consectetur."
    createButtonLabel="Add Resource"
    createPagePath="edge-services/create"
    :documentationService="props.documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        icon="pi pi-plus"
        label="Add Resource"
        @click="openDrawer"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>

  <CreateResource v-model:visible="visibleDrawer" />
</template>
