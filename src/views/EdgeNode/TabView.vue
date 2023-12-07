<script setup>
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import EditView from '@/views/EdgeNode/EditView.vue'

  const props = defineProps({
    loadEdgeNodeService: { type: Function, required: true },
    editEdgeNodeService: { type: Function, required: true },
    listGroupsEdgeNodeService: { type: Function, required: true },
    
    listServiceEdgeNodeService: { type: Function, required: true },
    deleteServiceEdgeNodeService: { type: Function, required: true },
    addServiceEdgeNodeService: { type: Function, required: true },
    loadServiceEdgeNodeService: { type: Function, required: true },
    editServiceEdgeNodeService: { type: Function, required: true },
    documentationServiceServices: { type: Function, required: true },
    
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const edgeNodeId = ref(route.params.id)

  const renderTabCurrentRouter = () => {
    const { services } = route.params
    activeTab.value = services ? 1 : 0
  }

  const changeRouteByClickingOnTab = (event) => {
    const { id } = route.params
    const isServicesTab = event.index === 1
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
          <div class="mt-4">
            <EditView
              :edgeNodeId="edgeNodeId"
              :listGroupsEdgeNodeService="props.listGroupsEdgeNodeService"
              :loadEdgeNodeService="props.loadEdgeNodeService"
              :editEdgeNodeService="props.editEdgeNodeService"
              :updatedRedirect="props.updatedRedirect"
            />
          </div>
        </TabPanel>
        <TabPanel header="Services">
          <div class="mt-4">
            <!-- <ListTableBlock
              pageTitleDelete="Service"
              addButtonLabel="Add Service"
              :listService="listServiceEdgeNode"
              :columns="servicesListColumns"
              :deleteService="deleteServiceEdgeNode"
              createPagePath="service/add"
              editPagePath="service"
            >
            </ListTableBlock> -->
          </div>
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
