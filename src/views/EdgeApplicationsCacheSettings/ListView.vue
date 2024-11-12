<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PrimeButton from 'primevue/button'
  import { computed, ref, inject } from 'vue'
  import Drawer from './Drawer'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

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
  const CACHE_SETTING_API_FIELDS = ['id', 'name', 'browser_cache', 'edge_cache']

  const listCacheSettingsServiceWithDecorator = async (query) => {
    return await props.listCacheSettingsService({ id: props.edgeApplicationId, ...query })
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
    handleTrackClickToCreate()
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

  const handleTrackClickToCreate = () => {
    tracker.product
      .clickToCreate({
        productName: 'Cache Settings'
      })
      .track()
  }

  const handleTrackClickToEdit = () => {
    tracker.product
      .clickToEdit({
        productName: 'Cache Settings'
      })
      .track()
  }
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

  <FetchListTableBlock
    v-if="hasContentToList"
    ref="listTableBlockRef"
    :listService="listCacheSettingsServiceWithDecorator"
    :columns="getColumns"
    :editInDrawer="openEditDrawer"
    @on-load-data="handleLoadData"
    @on-before-go-to-edit="handleTrackClickToEdit"
    emptyListMessage="No cache settings found."
    :actions="actions"
    isTabs
    :apiFields="CACHE_SETTING_API_FIELDS"
  >
    <template #addButton>
      <PrimeButton
        icon="pi pi-plus"
        label="Cache Setting"
        @click="openCreateDrawer"
        data-testid="edge-application-cache-settings-list__create-cache-settings__button"
      />
    </template>
  </FetchListTableBlock>

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
        data-testid="edge-application-cache-settings-list__create-cache-settings__button"
      />
    </template>
  </EmptyResultsBlock>
</template>
