<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import FormEditEdgeService from './FormFields/FormEditEdgeService.vue'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref } from 'vue'
  import ListViewResources from './ListViewResources.vue'

  const props = defineProps({
    loadEdgeService: { type: Function, required: true },
    editEdgeService: { type: Function, required: true },
    deleteResourcesServices: { type: Function, required: true },
    listResourcesServices: { type: Function, required: true },
    documentationServiceResource: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)

  const renderTabCurrentRouter = () => {
    const { resources } = route.params
    activeTab.value = resources ? 1 : 0
  }

  const changeRouteByClickingOnTab = (e) => {
    const { id } = route.params
    const isResourcesTab = e.index === 1
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

  const editEdgeServiceServicesWithDecorator = async (payload) => {
    return await props.editEdgeService({
      ...payload,
      edgeServiceID: route.params.id
    })
  }
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
          <FormEditEdgeService
            :loadService="props.loadEdgeService"
            :editService="editEdgeServiceServicesWithDecorator"
            :updatedRedirect="props.updatedRedirect"
            :showActionBar="!activeTab"
          />
        </TabPanel>
        <TabPanel header="Resources">
          <ListViewResources
            v-if="activeTab"
            :idEdgeService="route.params.id"
            :listResourcesServices="props.listResourcesServices"
            :deleteResourcesServices="props.deleteResourcesServices"
            :documentationServiceResource="props.documentationServiceResource"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
