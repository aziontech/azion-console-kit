<script setup>
  import { computed, ref, provide, watch, reactive, onMounted } from 'vue'
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

  defineOptions({ name: 'tabs-edge-node' })

  const props = defineProps({
    listGroupsEdgeNodeService: { type: Function, required: true },
    listServiceEdgeNodeService: { type: Function, required: true },
    documentationServiceServices: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const breadcrumbs = useBreadcrumbs()
  const activeTab = ref(0)
  const edgeNodeId = ref(route.params.id)
  const edgeNode = ref()
  const toast = useToast()

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const defaultTabs = {
    main_settings: 0,
    services: 1
  }

  // --- Cache from listing ---
  const cachedEdgeNode = edgeNodeService.getEdgeNodeFromCache(edgeNodeId.value)

  if (cachedEdgeNode?.name) {
    edgeNode.value = cachedEdgeNode
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, cachedEdgeNode.name)
  }

  const title = computed(() => {
    return edgeNode.value?.name || ''
  })

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

      return router.push({ name: props.updatedRedirect })
    }
  }

  const mapTabs = ref({ ...defaultTabs })

  const preloadTabData = async () => {
    if (!edgeNode.value) return
    await Promise.allSettled([
      edgeNodeService.prefetchEdgeNodeServicesList(edgeNodeId.value)
    ])
  }

  const renderTabCurrentRouter = async () => {
    const { services } = route.params
    activeTab.value = services ? 1 : 0

    edgeNode.value = { ...edgeNode.value, ...(await getEdgeNodesData()) }
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeNode.value?.name)
    preloadTabData()
  }

  const changeRouteByClickingOnTab = (event) => {
    changeTab(event.index)
  }

  const updateEdgeNodesValue = (edgeNodeValues) => {
    edgeNode.value = { ...edgeNode.value, ...edgeNodeValues }
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeNode.value?.name)
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

  onMounted(() => {
    renderTabCurrentRouter()
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :entityName="edgeNode?.name"
        description="Configure general settings and Edge Services for this Edge Node."
      />
    </template>
    <template #content>
      <div
        class="w-full h-full"
        v-if="edgeNode"
      >
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
              :listGroupsEdgeNodeService="props.listGroupsEdgeNodeService"
              :updatedRedirect="props.updatedRedirect"
              :isTab="true"
              :edgeNode="edgeNode"
              :initialValues="edgeNode"
            />
          </TabPanel>
          <TabPanel header="Services">
            <ListViewServices
              v-if="mapTabs.services === activeTab"
              :edgeNodeId="edgeNodeId"
              :listServiceEdgeNodeService="props.listServiceEdgeNodeService"
              :documentationServiceServices="props.documentationServiceServices"
            />
          </TabPanel>
        </TabView>
      </div>
    </template>
  </ContentBlock>
</template>
