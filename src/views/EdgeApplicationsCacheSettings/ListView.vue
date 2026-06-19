<script setup>
  import PrimeButton from '@aziontech/webkit/button'
  import { computed, ref, inject } from 'vue'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table/ListTable.vue'
  import Drawer from './Drawer'
  import { cacheSettingsService } from '@/services/v2/edge-app/edge-app-cache-settings-service'
  import { useVersionContext } from '@/composables/versioning/use-version-context'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    isApplicationAcceleratorEnabled: {
      required: true,
      type: Boolean
    },
    documentationService: {
      type: Function,
      required: true
    },
    isTieredCacheEnabled: {
      type: Boolean,
      required: true
    },
    service: {
      type: Object,
      default: null
    },
    versionId: {
      type: String,
      default: null
    }
  })

  const { readOnly, isVersioned } = useVersionContext()

  const drawerRef = ref('')
  const listTableRef = ref(null)

  //TODO: Fill this when API "fields" query parameter are fixed (id, name, modules)
  const CACHE_SETTING_API_FIELDS = []

  const listFn = props.service
    ? props.service.list
    : (query) => cacheSettingsService.listCacheSettingsService(props.edgeApplicationId, query)

  const deleteFn = props.service
    ? props.service.remove
    : (cacheSettingsId) =>
        cacheSettingsService.deleteCacheSettingService(props.edgeApplicationId, cacheSettingsId)

  const createDrawerService = props.service
    ? props.service.create
    : cacheSettingsService.createCacheSettingsService

  const loadDrawerService = props.service
    ? props.service.load
    : cacheSettingsService.loadCacheSettingsService

  const editDrawerService = props.service
    ? props.service.edit
    : cacheSettingsService.editCacheSettingsService

  const listCacheSettingsServiceWithDecorator = async (query) => {
    return await listFn(query)
  }

  const deleteCacheSettingsServiceWithDecorator = async (cacheSettingsId) => {
    return await deleteFn(cacheSettingsId)
  }

  const actions = computed(() => {
    if (readOnly.value) {
      return []
    }

    return [
      {
        label: 'Delete',
        type: 'delete',
        title: 'cache setting',
        icon: 'pi pi-trash',
        service: deleteCacheSettingsServiceWithDecorator
      }
    ]
  })

  const editInDrawerHandler = computed(() => (readOnly.value ? undefined : openEditDrawer))

  const openCreateDrawer = () => {
    handleTrackClickToCreate()
    drawerRef.value.openCreateDrawer()
  }
  const openEditDrawer = (item) => {
    drawerRef.value.openEditDrawer(item.id)
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
      },
      {
        field: 'browserCache',
        header: 'Browser Cache'
      },
      {
        field: 'cdnCache',
        header: 'Cache'
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

  const reloadList = () => {
    listTableRef.value?.reload()
  }

  const handleBeforeGoToEdit = () => {
    handleTrackClickToEdit()
  }

  defineExpose({
    openCreateDrawer
  })
</script>

<template>
  <Drawer
    ref="drawerRef"
    :isOverlapped="true"
    :isApplicationAcceleratorEnabled="isApplicationAcceleratorEnabled"
    :edgeApplicationId="edgeApplicationId"
    :createService="createDrawerService"
    :loadService="loadDrawerService"
    :editService="editDrawerService"
    :showTieredCache="isTieredCacheEnabled"
    @onSuccess="reloadList"
  />

  <ListTable
    ref="listTableRef"
    :listService="listCacheSettingsServiceWithDecorator"
    :columns="getColumns"
    :frozenColumns="['name']"
    :editInDrawer="editInDrawerHandler"
    :actions="actions"
    :apiFields="CACHE_SETTING_API_FIELDS"
    exportFileName="Application Cache Settings"
    :lazy="true"
    :isTabs="!isVersioned"
    :hideLastModifiedColumn="true"
    emptyListMessage="No cache settings found."
    :emptyBlock="{
      title: 'No cache settings yet',
      description:
        'Create your first cache setting to control how your content is stored and delivered.',
      createButtonLabel: 'Cache Setting',
      createPagePath: '/edge-applications/cache-settings/create',
      documentationService: props.documentationService,
      emptyListMessage: 'No cache settings found.'
    }"
    @on-before-go-to-edit="handleBeforeGoToEdit"
  >
    <template #emptyBlockButton>
      <PrimeButton
        v-if="!readOnly"
        icon="pi pi-plus"
        severity="secondary"
        label="Cache Setting"
        @click="openCreateDrawer"
        data-testid="edge-application-cache-settings-list__create-cache-settings__button"
      />
    </template>
  </ListTable>
</template>
