<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import FormEditEdgeService from './form/FormEditEdgeService.vue'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref } from 'vue'
  import ListViewResources from './ListViewResources.vue'

  const props = defineProps({
    loadEdgeService: { type: Function, required: true },
    editEdgeService: { type: Function, required: true },
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
        class="w-full"
      >
        <TabPanel header="Main Settings">
          <FormEditEdgeService
            :loadService="props.loadEdgeService"
            :editService="props.editEdgeService"
            :updatedRedirect="props.updatedRedirect"
            :showActionBar="!activeTab"
          />
        </TabPanel>
        <TabPanel header="Resources">
          <ListViewResources />
        </TabPanel>
      </TabView>
      <router-view></router-view>
    </template>
  </ContentBlock>
</template>
