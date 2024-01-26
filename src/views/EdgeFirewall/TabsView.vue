<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/EdgeFirewall/EditView'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import EdgeFirewallFunctionsListView from '@/views/EdgeFirewallFunctions/ListView'
  import { useToast } from 'primevue/usetoast'

  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'tabs-edge-firewall' })

  const props = defineProps({
    edgeFirewallServices: { type: Object, required: true },
    listDomainsService: { type: Function, required: true }
  })

  const defaultTabs = {
    main_settings: 0,
    functions: 1,
    rules_engine: 2
  }

  const mapTabs = ref({ ...defaultTabs })

  const toast = useToast()
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const edgeFirewallId = ref(route.params.id)
  const edgeFirewall = ref()

  const loaderEdgeFirewall = async () => {
    try {
      return await props.edgeFirewallServices.loadEdgeFirewallService({
        id: edgeFirewallId.value
      })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })

      return router.push({ name: props.edgeFirewallServices.updatedRedirect })
    }
  }

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    const selectedTab = tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByClickingOnTab = ({ index = 0 }) => {
    verifyTab(edgeFirewall.value)
    const tab = getTabFromValue(index)
    activeTab.value = index
    const params = {
      id: edgeFirewallId.value,
      tab
    }
    router.push({
      name: 'edit-edge-firewall',
      params
    })
  }

  const verifyTab = ({ edgeFunctionsEnabled }) => {
    if (!edgeFunctionsEnabled) {
      delete mapTabs.value.functions
      mapTabs.value = Object.entries(mapTabs.value).reduce((acc, [key], index) => {
        acc[key] = index
        return acc
      }, {})
      return
    }
    mapTabs.value = { ...defaultTabs }
  }

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    edgeFirewall.value = await loaderEdgeFirewall()
    verifyTab(edgeFirewall.value)
    const activeTabIndexByRoute = mapTabs.value[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  const title = computed(() => {
    return edgeFirewall.value?.name || ''
  })

  const isEnableFunction = computed(() => {
    return edgeFirewall.value?.edgeFunctionsEnabled
  })

  const updatedFirewall = (firewall) => {
    edgeFirewall.value = { ...firewall }
    verifyTab(edgeFirewall.value)
  }

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
        v-if="edgeFirewall"
      >
        <TabPanel header="Main Settings">
          <EditView
            v-if="mapTabs.main_settings === activeTab"
            :editEdgeFirewallService="edgeFirewallServices.editEdgeFirewallService"
            :edgeFirewall="edgeFirewall"
            :loadDomains="props.listDomainsService"
            :updatedRedirect="edgeFirewallServices.updatedRedirect"
            @updatedFirewall="updatedFirewall"
          />
        </TabPanel>
        <TabPanel
          header="Functions Instances"
          v-if="isEnableFunction"
        >
          <EdgeFirewallFunctionsListView
            v-bind="props.edgeFirewallServices"
            :edgeFirewallID="edgeFirewallId"
          />
        </TabPanel>
        <TabPanel header="Rules Engine"></TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
