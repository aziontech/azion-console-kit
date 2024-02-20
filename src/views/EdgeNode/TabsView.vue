<script setup>
  import { ref, provide, watch, reactive } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import EditView from '@/views/EdgeNode/EditView'
  import ListViewServices from '@/views/EdgeNode/ListViewTabServices'
  defineOptions({ name: 'tabs-edge-node' })

  const props = defineProps({
    loadEdgeNodeService: { type: Function, required: true },
    editEdgeNodeService: { type: Function, required: true },
    listGroupsEdgeNodeService: { type: Function, required: true },
    listServiceEdgeNodeService: { type: Function, required: true },
    deleteServiceEdgeNodeService: { type: Function, required: true },
    createServiceEdgeNodeService: { type: Function, required: true },
    loadServiceEdgeNodeService: { type: Function, required: true },
    editServiceEdgeNodeService: { type: Function, required: true },
    documentationServiceServices: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const edgeNodeId = ref(route.params.id)

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: true })
  const formHasUpdated = ref(false)

  const defaultTabs = {
    main_settings: 0,
    services: 1
  }

  const mapTabs = ref({ ...defaultTabs })

  const renderTabCurrentRouter = () => {
    const { services } = route.params
    activeTab.value = services ? 1 : 0
  }

  const changeRouteByClickingOnTab = (event) => {
    changeTab(event.index)
  }

  const changeTab = (index) => {
    const { id } = route.params
    const isServicesTab = index === 1
    activeTab.value = isServicesTab ? 1 : 0
    const params = {
      id,
      services: isServicesTab ? 'services' : ''
    }
    router.push({
      name: 'edit-edge-node',
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
      tabHasUpdate.updated = Math.random()
    }
  })

  renderTabCurrentRouter()
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Node" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel header="Main Settings">
          <EditView
            v-if="mapTabs.main_settings === activeTab"
            :hiddenActionBar="!activeTab"
            :listGroupsEdgeNodeService="props.listGroupsEdgeNodeService"
            :loadEdgeNodeService="props.loadEdgeNodeService"
            :editEdgeNodeService="props.editEdgeNodeService"
            :updatedRedirect="props.updatedRedirect"
            :isTab="true"
          />
        </TabPanel>
        <TabPanel header="Services">
          <ListViewServices
            v-if="mapTabs.services === activeTab"
            :edgeNodeId="edgeNodeId"
            :createServiceEdgeNodeService="props.createServiceEdgeNodeService"
            :editServiceEdgeNodeService="props.editServiceEdgeNodeService"
            :loadServiceEdgeNodeService="props.loadServiceEdgeNodeService"
            :listServiceEdgeNodeService="props.listServiceEdgeNodeService"
            :deleteServiceEdgeNodeService="props.deleteServiceEdgeNodeService"
            :documentationServiceServices="props.documentationServiceServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
