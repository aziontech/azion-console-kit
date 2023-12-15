<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import EditView from '@/views/EdgeServices/EditView'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref } from 'vue'
  import ListViewTabResources from '@/views/EdgeServices/ListViewTabResources'
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
  const activeTab = ref(0)
  const edgeServiceId = ref(route.params.id)

  const renderTabCurrentRouter = () => {
    const { resources } = route.params
    activeTab.value = resources ? 1 : 0
  }

  const changeRouteByClickingOnTab = (event) => {
    const { id } = route.params
    const isResourcesTab = event.index === 1
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

  renderTabCurrentRouter()
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Service" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel header="Main Settings">
          <EditView
            :hiddenActionBar="!activeTab"
            :loadEdgeService="props.loadEdgeService"
            :editEdgeService="props.editEdgeService"
            :updatedRedirect="props.updatedRedirect"
          />
        </TabPanel>
        <TabPanel header="Resources">
          <ListViewTabResources
            v-if="activeTab"
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
