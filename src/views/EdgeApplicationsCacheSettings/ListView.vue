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
    listCacheSettingsService: {
      type: Function,
      required: true
    },
    loadCacheSettingsService: {
      type: Function,
      required: true
    },
    editCacheSettingsService: {
      type: Function,
      required: true
    },
    deleteCacheSettingsService: {
      type: Function,
      required: true
    },
    createCacheSettingsService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    },
    showTieredCache: {
      type: Boolean,
      required: true
    }
  })

  const hasContentToList = ref(true)
  const listTableBlockRef = ref('')
  const drawerRef = ref('')

  const listCacheSettingsServiceWithDecorator = async () => {
    return await props.listCacheSettingsService({ id: props.edgeApplicationId })
  }

  const deleteCacheSettingsServiceWithDecorator = async (cacheSettingsId) => {
    return await props.deleteCacheSettingsService({
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
    :createService="props.createCacheSettingsService"
    :loadService="props.loadCacheSettingsService"
    :editService="props.editCacheSettingsService"
    :showTieredCache="props.showTieredCache"
    @onSuccess="reloadList"
  />

  <ListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    :listService="listCacheSettingsServiceWithDecorator"
    :deleteService="deleteCacheSettingsServiceWithDecorator"
    :columns="getColumns"
    pageTitleDelete="cache setting"
    :editInDrawer="openEditDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No cache settings found."
  >
    <template #addButton>
      <PrimeButton
        icon="pi pi-plus"
        label="Cache Setting"
        @click="openCreateDrawer"
      />
    </template>
  </ListTableBlock>

  <EmptyResultsBlock
    v-else
    title="No cache settings have been created"
    description="Click the button below to create your first cache setting."
    createButtonLabel="Cache Setting"
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="Cache Setting"
        @click="openCreateDrawer"
      />
    </template>
  </EmptyResultsBlock>
</template>
