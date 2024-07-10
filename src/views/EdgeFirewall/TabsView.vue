<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/EdgeFirewall/EditView'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import EdgeFirewallFunctionsListView from '@/views/EdgeFirewallFunctions/ListView'
  import EdgeFirewallRulesEngineListView from '@/views/EdgeFirewallRulesEngine/ListView'
  import { useToast } from 'primevue/usetoast'

  import { computed, ref, watch, provide, reactive, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

  defineOptions({ name: 'tabs-edge-firewall' })

  const props = defineProps({
    edgeFirewallServices: { type: Object, required: true },
    listDomainsService: { type: Function, required: true },
    rulesEngineServices: { type: Object, required: true },
    listNetworkListService: { type: Function, required: true }
  })

  const defaultTabs = {
    mainSettings: 0,
    functions: 1,
    rulesEngine: 2
  }

  const mapTabs = ref({ ...defaultTabs })

  const toast = useToast()
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const edgeFirewallId = ref(route.params.id)
  const edgeFirewall = ref()

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

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
    changeTab(index)
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

  const showFunctionsTab = computed(() => {
    return edgeFirewall.value?.edgeFunctionsEnabled
  })
  const showRulesEngine = computed(() => {
    return activeTab.value === mapTabs.value.rulesEngine
  })

  const showMainSettingsTab = computed(() => {
    return mapTabs.value.mainSettings === activeTab.value
  })

  const updatedFirewall = (firewall) => {
    edgeFirewall.value = { ...firewall }
    verifyTab(edgeFirewall.value)
  }

  const edgeFirewallModules = computed(() => {
    return {
      webApplicationFirewall: edgeFirewall.value.wafEnabled,
      debugRules: edgeFirewall.value.debugRules,
      networkProtectionLayer: edgeFirewall.value.networkProtectionEnabled,
      edgeFunctions: edgeFirewall.value.edgeFunctionsEnabled
    }
  })

  onMounted(() => {
    renderTabCurrentRouter()
  })

  const changeTab = (index) => {
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
        <TabPanel header="Main Settings"
          :pt="{
                headerAction: {
                  'data-testid': 'edge-firewall__main-settings-tab'
                }
              }"
        >
          <EditView
            v-if="showMainSettingsTab"
            :editEdgeFirewallService="edgeFirewallServices.editEdgeFirewallService"
            :edgeFirewall="edgeFirewall"
            :loadDomains="props.listDomainsService"
            :updatedRedirect="edgeFirewallServices.updatedRedirect"
            :isTab="true"
            @updatedFirewall="updatedFirewall"
          />
        </TabPanel>
        <TabPanel
          header="Functions Instances"
          v-if="showFunctionsTab"
          :pt="{
                headerAction: {
                  'data-testid': 'edge-firewall__functions-tab'
                }
              }"
        >
          <EdgeFirewallFunctionsListView
            v-if="showFunctionsTab"
            v-bind="props.edgeFirewallServices"
            :edgeFirewallID="edgeFirewallId"
          />
        </TabPanel>
        <TabPanel header="Rules Engine"
          :pt="{
                headerAction: {
                  'data-testid': 'edge-firewall__rules-engine-tab'
                }
              }"
        >
          <EdgeFirewallRulesEngineListView
            v-if="showRulesEngine"
            :edgeFirewallModules="edgeFirewallModules"
            :edgeFirewallId="edgeFirewallId"
            v-bind="props.rulesEngineServices"
            :listNetworkListService="props.listNetworkListService"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
