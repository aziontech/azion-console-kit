<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  
  import EdgeApplicationsRulesEngineListView from '@/views/EdgeApplicationsRulesEngine/ListView'
  import EdgeApplicationsFunctionsListView from '@/views/EdgeApplicationsFunctions/ListView'
  import EditView from './EditView.vue'

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    edgeFirewallServices: { type: Object, required: true },
    listDomainsService: { type: Function, required: true },
    rulesEngineServices: { type: Object, required: true },
    functionsServices: { type: Object, required: true }
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
  const edgeApplicationId = ref(route.params.id)
  const isEnableFunction = ref(false)

  // const loaderEdgeApplication = async () => {
  //   try {
  //     const { edgeFunctions, loadBalancer } =
  //       await props.edgeApplicationServices.loadEdgeApplication({
  //         id: edgeApplicationId.value
  //       })
  //     isEnableEdgeFunction.value = edgeFunctions
  //   } catch (error) {
  //     toast.add({
  //       closable: true,
  //       severity: 'error',
  //       summary: error
  //     })
  //   }
  // }

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs)
    const selectedTab = tabNames.find((tabName) => mapTabs[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByClickingOnTab = (event) => {
    const tab = getTabFromValue(event.index)
    activeTab.value = event.index
    const params = {
      id: edgeApplicationId.value,
      tab
    }
    router.push({
      name: 'edit-edge-firewall',
      params
    })
  }

  const renderTabCurrentRouter = async () => {
    // await loaderEdgeApplication()
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
      <PageHeadingBlock pageTitle="Name Rule Set" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel header="Main Settings">
          <div class="mt-8">
            <EditView
              :editEdgeFirewallService="edgeFirewallServices.editEdgeApplication"
              :loadEdgeEdgeFirewallService="edgeFirewallServices.loadEdgeApplication"
              :updatedRedirect="edgeFirewallServices.updatedRedirect"
              :showActionBar="activeTab === mapTabs.mainSettings"
            />
          </div>
        </TabPanel>
        <TabPanel
          header="Functions"
          v-if="isEnableEdgeFunction"
        >
          <EdgeApplicationsFunctionsListView
            v-if="activeTab === mapTabs.functions"
            v-bind="props.functionsServices"
            :edgeApplicationId="edgeApplicationId"
          />
        </TabPanel>
        <TabPanel header="Rules Engine">
          <EdgeApplicationsRulesEngineListView
            v-if="activeTab === mapTabs.rulesEngine"
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.rulesEngineServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
