<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import EditView from '@/views/EdgeServices/EditView'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref, watch, provide, reactive, computed } from 'vue'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import ListViewTabResources from '@/views/EdgeServices/ListViewTabResources'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    loadEdgeService: { type: Function, required: true },
    editEdgeService: { type: Function, required: true },
    listResourcesServices: { type: Function, required: true },
    deleteResourcesServices: { type: Function, required: true },
    editResourcesServices: { type: Function, required: true },
    createResourcesServices: { type: Function, required: true },
    loadResourcesServices: { type: Function, required: true },
    documentationServiceResource: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()

  const activeTab = ref(0)
  const edgeServiceId = ref(route.params.id)

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const componentsRefs = ref(null)

  const defaultTabs = {
    main_settings: 0,
    resources: 1
  }

  const title = ref('')

  const tabs = ref([
    {
      header: 'Main Settings',
      component: EditView,
      condition: true,
      show: () => mapTabs.value.main_settings === activeTab.value,
      props: () => ({
        hiddenActionBar: !activeTab.value,
        loadEdgeService: props.loadEdgeService,
        editEdgeService: props.editEdgeService,
        updatedRedirect: props.updatedRedirect,
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
        listResourcesServices: props.listResourcesServices,
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
      click: () => componentsRefs.value[0].openCreateDrawer?.()
    }
  })

  const getEdgeService = async () => {
    try {
      const result = await props.loadEdgeService({ id: edgeServiceId.value })
      title.value = result.name
      breadcrumbs.update(route.meta.breadCrumbs ?? [], route, result.name)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Loading failed',
        detail: error
      })
    }
  }

  const updateEdgeServiceValue = (value) => {
    title.value = value.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, value.name)
  }

  const mapTabs = ref({ ...defaultTabs })

  const renderTabCurrentRouter = async () => {
    await getEdgeService()
    const { resources } = route.params
    activeTab.value = resources ? 1 : 0
  }

  const changeRouteByClickingOnTab = (event) => {
    changeTab(event.index)
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

  const visibleOnSaved = ref(false)

  provide('unsaved', {
    changeTab,
    tabHasUpdate,
    formHasUpdated,
    visibleOnSaved
  })

  watch(activeTab, (newValue, oldValue) => {
    if (visibleOnSaved.value) {
      return
    } else {
      tabHasUpdate.oldTab = oldValue
      tabHasUpdate.nextTab = newValue
      tabHasUpdate.updated = generateCurrentTimestamp()
    }
  })

  renderTabCurrentRouter()
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :entityName="title"
      />
    </template>
    <template #content>
      <div class="h-full w-full">
        <div class="flex align-center justify-between relative">
          <TabView
            :activeIndex="activeTab"
            @tab-click="changeRouteByClickingOnTab"
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
              v-bind="tab.props()"
            />
          </template>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>
