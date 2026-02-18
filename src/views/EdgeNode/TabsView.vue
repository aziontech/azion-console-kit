<script setup>
  import { ref, provide, watch, reactive } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import EditView from '@/views/EdgeNode/EditView'
  import ListViewServices from '@/views/EdgeNode/ListViewTabServices'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { useToast } from 'primevue/usetoast'
  import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'

  defineOptions({ name: 'tabs-edge-node' })

  const props = defineProps({
    documentationServiceServices: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const breadcrumbs = useBreadcrumbs()
  const activeTab = ref(0)
  const edgeNodeId = ref(route.params.id)
  const toast = useToast()

  const cachedNode = edgeNodeService.getEdgeNodeFromCache(edgeNodeId.value) ?? {}
  const title = ref(cachedNode.name || '')
  const edgeNode = ref(cachedNode)

  if (cachedNode.name) {
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, cachedNode.name)
  }

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const defaultTabs = {
    main_settings: 0,
    services: 1
  }

  const getEdgeNodesData = async () => {
    try {
      return await edgeNodeService.loadEdgeNodeService({ id: edgeNodeId.value })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error
      })
    }
  }

  const mapTabs = ref({ ...defaultTabs })

  const renderTabCurrentRouter = async () => {
    const tableDefinitions = useTableDefinitionsStore()
    const pageSize = tableDefinitions.getNumberOfLinesPerPage || 10

    edgeNodeService.prefetchTabsData(edgeNodeId.value, pageSize)

    const { services } = route.params
    activeTab.value = services ? 1 : 0

    if (!cachedNode.name) {
      const data = await getEdgeNodesData()
      if (data) {
        edgeNode.value = data
        title.value = data.name
        breadcrumbs.update(route.meta.breadCrumbs ?? [], route, data.name)
      }
    }
  }

  const changeRouteByClickingOnTab = (event) => {
    changeTab(event.index)
  }

  const updateEdgeNodesValue = async (edgeNodeValues) => {
    title.value = edgeNodeValues.name
    edgeNode.value = await getEdgeNodesData()
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeNodeValues.name)
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
        :entityName="edgeNode?.name"
      />
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
            @handleEdgeNodesUpdated="updateEdgeNodesValue"
            :hiddenActionBar="!activeTab"
            :initialValues="cachedNode"
            :updatedRedirect="props.updatedRedirect"
            :isTab="true"
          />
        </TabPanel>
        <TabPanel header="Services">
          <ListViewServices
            v-if="mapTabs.services === activeTab"
            :edgeNodeId="edgeNodeId"
            :createServiceEdgeNodeService="edgeNodeService.createServiceEdgeNodeService"
            :editServiceEdgeNodeService="edgeNodeService.editServiceEdgeNodeService"
            :loadServiceEdgeNodeService="edgeNodeService.loadServiceEdgeNodeService"
            :listServiceEdgeNodeService="edgeNodeService.listServiceEdgeNodeService"
            :deleteServiceEdgeNodeService="edgeNodeService.deleteServiceEdgeNodeService"
            :documentationServiceServices="props.documentationServiceServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
