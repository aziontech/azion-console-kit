<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import EditView from '@/views/EdgeServices/EditView'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref, computed, nextTick } from 'vue'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import ListViewTabResources from '@/views/EdgeServices/ListViewTabResources'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { edgeServiceService } from '@/services/v2/edge-service/edge-service-service'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'
  import EditViewSkeleton from './components/EditViewSkeleton.vue'

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    deleteResourcesServices: { type: Function, required: true },
    editResourcesServices: { type: Function, required: true },
    createResourcesServices: { type: Function, required: true },
    loadResourcesServices: { type: Function, required: true },
    documentationServiceResource: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const breadcrumbs = useBreadcrumbs()

  const activeTab = ref(0)
  const edgeServiceId = ref(route.params.id)
  const cachedService = edgeServiceService.getEdgeServiceFromCache(edgeServiceId.value) ?? {}

  const componentsRefs = ref(null)

  const defaultTabs = {
    main_settings: 0,
    resources: 1
  }

  const title = ref(cachedService.name || '')
  const isServiceLoaded = ref(!!cachedService.name)

  const shouldShowSkeleton = computed(() => {
    if (!isServiceLoaded.value) return true
    return false
  })

  const tabs = ref([
    {
      header: 'Main Settings',
      component: EditView,
      condition: true,
      show: () => mapTabs.value.main_settings === activeTab.value,
      props: () => ({
        hiddenActionBar: !activeTab.value,
        updatedRedirect: props.updatedRedirect,
        initialValues: cachedService,
        isTab: true
      })
    },
    {
      header: 'Resources',
      component: ListViewTabResources,
      condition: true,
      show: () => mapTabs.value.resources === activeTab.value,
      showAddButtonTab: true,
      props: () => ({
        edgeServiceId: edgeServiceId.value,
        createResourcesServices: props.createResourcesServices,
        editResourcesServices: props.editResourcesServices,
        loadResourcesServices: props.loadResourcesServices,
        listResourcesServices: edgeServiceService.listResourcesService,
        deleteResourcesServices: props.deleteResourcesServices,
        documentationServiceResource: props.documentationServiceResource
      })
    }
  ])

  const filteredTabs = computed(() => {
    return tabs.value.filter((tab) => {
      return typeof tab.condition === 'function' ? tab.condition() : tab.condition
    })
  })

  const addButtonController = computed(() => {
    const tab = filteredTabs.value[activeTab.value]
    return {
      showAddButtonTab: !!tab?.showAddButtonTab,
      label: tab?.header || 'Create',
      click: () => componentsRefs.value?.[0]?.openCreateDrawer?.()
    }
  })

  const updateEdgeServiceValue = (value) => {
    title.value = value.name
    isServiceLoaded.value = true
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, value.name)
  }

  const mapTabs = ref({ ...defaultTabs })

  if (cachedService.name) {
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, cachedService.name)
  }

  const renderTabCurrentRouter = () => {
    const tableDefinitions = useTableDefinitionsStore()
    const pageSize = tableDefinitions.getNumberOfLinesPerPage || 10
    edgeServiceService.prefetchTabsData(edgeServiceId.value, pageSize)

    const { resources } = route.params
    activeTab.value = resources ? 1 : 0
  }

  const changeTab = (index) => {
    const { id } = route.params
    const isResourcesTab = index === 1
    activeTab.value = isResourcesTab ? 1 : 0
    const params = {
      id,
      resources: isResourcesTab ? 'resources' : ''
    }
    router.push({
      name: 'edit-edge-services',
      params
    })
  }

  const { unsaved, requestTabChange } = provideTabUnsaved(changeTab)

  const tabViewRef = ref(null)

  const handleTabClick = ({ index = 0 }) => {
    requestTabChange(activeTab.value, index)
    if (unsaved.isDialogVisible.value && tabViewRef.value) {
      nextTick(() => {
        tabViewRef.value.d_activeIndex = activeTab.value
      })
    }
  }

  renderTabCurrentRouter()
</script>

<template>
  <EditViewSkeleton v-if="shouldShowSkeleton" />
  <ContentBlock v-else>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :entityName="title"
        description="Configure variables and resources to orchestrate to your Edge Node."
      />
    </template>
    <template #content>
      <DialogUnsaved
        :visible="unsaved.isDialogVisible.value"
        @leave="unsaved.confirmLeave"
        @stay="unsaved.cancelLeave"
      />
      <div class="h-full w-full">
        <div class="flex align-center justify-between relative">
          <TabView
            ref="tabViewRef"
            :activeIndex="activeTab"
            @tab-click="handleTabClick"
            class="flex-1"
          >
            <TabPanel
              v-for="(tab, index) in filteredTabs"
              :pt="{
                headerAction: {
                  id: `tab_${index}`
                },
                root: {
                  'data-testid': `edge-service-details-tab-panel__${tab.header}__tab`,
                  id: `${tab.header}`
                }
              }"
              :key="index"
              :header="tab.header"
            >
            </TabPanel>
          </TabView>
          <div
            v-if="addButtonController.showAddButtonTab"
            class="flex ml-4 items-center"
          >
            <PrimeButton
              :label="addButtonController.label"
              size="small"
              icon="pi pi-plus"
              @click="addButtonController.click"
              data-testid="data-table-actions-column-body-actions-menu-button"
            />
          </div>
        </div>

        <div>
          <template
            v-for="(tab, index) in filteredTabs"
            :key="index"
          >
            <component
              ref="componentsRefs"
              :is="tab.component"
              v-if="tab.show()"
              @handleEdgeServiceUpdated="updateEdgeServiceValue"
              @loaded-service-object="updateEdgeServiceValue"
              v-bind="tab.props()"
            />
          </template>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>
