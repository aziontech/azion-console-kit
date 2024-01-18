<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/EdgeFirewall/EditView'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import EdgeFirewallFunctionsListView from '@/views/EdgeFirewallFunctions/ListView'
  import { useToast } from 'primevue/usetoast'

  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'tabs-edge-firewall' })

  const props = defineProps({
    edgeFirewallServices: { type: Object, required: true },
    listDomainsService: { type: Function, required: true }
  })

  const mapTabs = {
    mainSettings: 0,
    functions: 1,
    rulesEngine: 2
  }

  const toast = useToast()
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const edgeFirewallId = ref(route.params.id)
  const isEnableFunction = ref(false)
  const responseEdgeFirewall = ref(false)
  const title = ref('Name Rule Set')

  const loaderEdgeFirewall = async () => {
    try {
      if (responseEdgeFirewall.value) return responseEdgeFirewall.value

      const response = await props.edgeFirewallServices.loadEdgeFirewallService({
        id: edgeFirewallId.value
      })

      const { edgeFunctionsEnabled, name } = response
      isEnableFunction.value = edgeFunctionsEnabled
      title.value = name
      responseEdgeFirewall.value = response
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs)
    const selectedTab = tabNames.find((tabName) => mapTabs[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByClickingOnTab = (event) => {
    const tab = getTabFromValue(event.index)
    activeTab.value = event.index
    const params = {
      id: edgeFirewallId.value,
      tab
    }
    router.push({
      name: 'edit-edge-firewall',
      params
    })
  }

  const renderTabCurrentRouter = async () => {
    await loaderEdgeFirewall()
    const { tab } = route.params
    const defaultTabIndex = 0
    const activeTabIndexByRoute = mapTabs[tab] || defaultTabIndex
    activeTab.value = activeTabIndexByRoute
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
        v-if="responseEdgeFirewall"
      >
        <TabPanel header="Main Settings">
          <EditView
            :editEdgeFirewallService="edgeFirewallServices.editEdgeFirewallService"
            :loadEdgeFirewallService="loaderEdgeFirewall"
            :loadDomains="props.listDomainsService"
            :updatedRedirect="edgeFirewallServices.updatedRedirect"
            :showActionBar="activeTab === mapTabs.mainSettings"
          />
        </TabPanel>
        <TabPanel
          header="Functions"
          v-if="isEnableFunction">
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
