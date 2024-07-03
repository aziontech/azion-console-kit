<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/action-column.vue'
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
    isApplicationAcceleratorEnabled: {
      required: true,
      type: Boolean
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
    isTieredCacheEnabled: {
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

  const actions = [
    {
      type: 'delete',
      title: 'cache setting',
      icon: 'pi pi-trash',
      service: deleteCacheSettingsServiceWithDecorator
    }
  ]

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
    :isApplicationAcceleratorEnabled="isApplicationAcceleratorEnabled"
    :edgeApplicationId="edgeApplicationId"
    :createService="createCacheSettingsService"
    :loadService="loadCacheSettingsService"
    :editService="editCacheSettingsService"
    :showTieredCache="isTieredCacheEnabled"
    @onSuccess="reloadList"
  />

  <ListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    :listService="listCacheSettingsServiceWithDecorator"
    :columns="getColumns"
    :editInDrawer="openEditDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No cache settings found."
    :actions="actions"
    isTabs
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
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Cache Setting"
        @click="openCreateDrawer"
      />
    </template>
  </EmptyResultsBlock>
</template>
