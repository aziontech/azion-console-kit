<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import Drawer from './Drawer'

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    listEdgeCacheService: {
      type: Function,
      required: true
    },
    loadEdgeCacheService: {
      type: Function,
      required: true
    },
    editEdgeCacheService: {
      type: Function,
      required: true
    },
    deleteEdgeCacheService: {
      type: Function,
      required: true
    },
    createEdgeCacheService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)
  const listTableBlockRef = ref('')
  const drawerRef = ref('')

  const listEdgeCacheServiceWithDecorator = async () => {
    return await props.listEdgeCacheService({ id: props.edgeApplicationId })
  }

  const deleteEdgeCacheServiceWithDecorator = async (cacheSettingsId) => {
    return await props.deleteEdgeCacheService({
      edgeApplicationId: props.edgeApplicationId,
      id: cacheSettingsId
    })
  }

  const openCreateDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }
  const openEditDrawer = (item) => {
    drawerRef.value.openEditDrawer(item.id)
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Origin Name'
      },
      {
        field: 'browserCache',
        header: 'Browser Cache'
      },
      {
        field: 'cdnCache',
        header: 'Edge Cache'
      }
    ]
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :edgeApplicationId="props.edgeApplicationId"
    :createService="props.createEdgeCacheService"
    :loadService="props.loadEdgeCacheService"
    :editService="props.editEdgeCacheService"
    @onSuccess="reloadList"
  />

  <ListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    :listService="listEdgeCacheServiceWithDecorator"
    :deleteService="deleteEdgeCacheServiceWithDecorator"
    :columns="getColumns"
    pageTitleDelete="Edge Cache"
    :editInDrawer="openEditDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No Edge Cache found."
  >
    <template #addButton>
      <PrimeButton
        icon="pi pi-plus"
        label="Edge Cache"
        @click="openCreateDrawer"
      />
    </template>
  </ListTableBlock>

  <EmptyResultsBlock
    v-else
    title="No edge cache have been created"
    description="Click the button below to initiate the setup process and create your first edge cache."
    createButtonLabel="Edge Cache"
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="Edge Cache"
        @click="openCreateDrawer"
      />
    </template>
  </EmptyResultsBlock>
</template>
