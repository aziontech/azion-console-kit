<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import EditView from '@/views/EdgeServices/EditView'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref, watch, provide, reactive } from 'vue'
  import ListViewTabResources from '@/views/EdgeServices/ListViewTabResources'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { useToast } from 'primevue/usetoast'

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

  const activeTab = ref(0)
  const edgeServiceId = ref(route.params.id)

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const defaultTabs = {
    main_settings: 0,
    resources: 1
  }

  const title = ref('')

  const getEdgeService = async () => {
    try {
      const result = await props.loadEdgeService({ id: edgeServiceId.value })
      title.value = result.name
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
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel
          header="Main Settings"
          :pt="{
            root: { 'data-testid': 'edge-service-tabs__tab__main-settings' }
          }"
        >
          <EditView
            v-if="mapTabs.main_settings === activeTab"
            :hiddenActionBar="!activeTab"
            :loadEdgeService="props.loadEdgeService"
            :editEdgeService="props.editEdgeService"
            @handleEdgeServiceUpdated="updateEdgeServiceValue"
            :updatedRedirect="props.updatedRedirect"
            :isTab="true"
          />
        </TabPanel>
        <TabPanel
          header="Resources"
          :pt="{ root: { 'data-testid': 'edge-service-tabs__tab__resources' } }"
        >
          <ListViewTabResources
            v-if="mapTabs.resources === activeTab"
            :edgeServiceId="edgeServiceId"
            :createResourcesServices="props.createResourcesServices"
            :editResourcesServices="props.editResourcesServices"
            :loadResourcesServices="props.loadResourcesServices"
            :listResourcesServices="props.listResourcesServices"
            :deleteResourcesServices="props.deleteResourcesServices"
            :documentationServiceResource="props.documentationServiceResource"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
