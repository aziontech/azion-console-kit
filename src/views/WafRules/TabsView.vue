<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/WafRules/EditView.vue'
  import ListViewWafRulesAllowed from '@/views/WafRules/ListWafRulesAllowed.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'

  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'tabs-waf-rules' })

  const props = defineProps({
    wafServices: { type: Object, required: true },
    wafRulesAllowed: { type: Object, required: true }
  })

  const mapTabs = {
    mainSettings: 0,
    tuning: 1,
    allowed: 2
  }

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const wafRuleId = ref(route.params.id)

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs)
    const selectedTab = tabNames.find((tabName) => mapTabs[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByClickingOnTab = (event) => {
    const tab = getTabFromValue(event.index)
    activeTab.value = event.index
    const params = {
      id: wafRuleId.value,
      tab
    }
    router.push({
      name: 'edit-waf-rules',
      params
    })
  }

  const renderTabCurrentRouter = async () => {
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
      <PageHeadingBlock pageTitle="Edit WAF Rules" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel header="Main Settings">
          <EditView
            :editWafRulesService="props.wafServices.editWafRulesService"
            :loadWafRulesService="props.wafServices.loadWafRulesService"
          ></EditView>
        </TabPanel>
        <TabPanel header="Tuning">
          <h1>Tuning</h1>
        </TabPanel>
        <TabPanel header="Allowed Rules">
          <ListViewWafRulesAllowed
            :listWafRulesAllowedService="props.wafRulesAllowed.listWafRulesAllowedService"
            :deleteWafRulesAllowedService="props.wafRulesAllowed.deleteWafRulesAllowedService"
            :createWafRulesAllowedService="props.wafRulesAllowed.createWafRulesAllowedService"
            :loadWafRulesAllowedService="props.wafRulesAllowed.loadWafRulesAllowedService"
            :editWafRulesAllowedService="props.wafRulesAllowed.editWafRulesAllowedService"
            :documentationServiceAllowed="props.wafRulesAllowed.documentationServiceAllowed"
          ></ListViewWafRulesAllowed>
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
