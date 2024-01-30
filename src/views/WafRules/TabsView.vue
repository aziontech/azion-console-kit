<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/WafRules/EditView.vue'
  import ListWafRulesAllowed from '@/views/WafRules/ListWafRulesAllowed.vue'
  import ListWafRulesTuning from '@/views/WafRules/ListWafRulesTuning.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'

  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'tabs-waf-rules' })

  const props = defineProps({
    wafServices: { type: Object, required: true },
    wafRulesAllowed: { type: Object, required: true },
    wafTuning: { type: Object, required: true }
  })

  const mapTabs = {
    mainSettings: 0,
    tuning: 1,
    allowed: 2
  }

  const route = useRoute()
  const toast = useToast()
  const router = useRouter()
  const activeTab = ref(0)
  const wafRuleId = ref(route.params.id)
  const wafName = ref('')

  const getWafDat = async () => {
    try {
      const response = await props.wafServices.loadWafRulesService({ id: wafRuleId.value })
      wafName.value = response.name
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
      id: wafRuleId.value,
      tab
    }
    router.push({
      name: 'edit-waf-rules',
      params
    })
  }

  const updateWafRulesValue = (wafRulesUpdated) => {
    wafName.value = wafRulesUpdated.name
  }

  const renderTabCurrentRouter = async () => {
    getWafDat()
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
      <PageHeadingBlock :pageTitle="wafName" />
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
            :showActionBar="activeTab === mapTabs.mainSettings"
            @handleWafRulesUpdated="updateWafRulesValue"
          />
        </TabPanel>
        <TabPanel header="Tuning">
          <ListWafRulesTuning
            :documentationServiceTuning="props.wafTuning.documentationServiceTuning"
            :listWafRulesTuningService="props.wafTuning.listWafRulesTuningService"
            :listCountriesService="props.wafTuning.listCountriesService"
            :listNetworkListService="props.wafTuning.listNetworkListService"
            :listWafRulesDomainsService="props.wafTuning.listWafRulesDomainsService"
            :showActionBar="activeTab === mapTabs.tuning"
            :createWafRulesAllowedTuningService="props.wafTuning.createWafRulesAllowedTuningService"
            :listWafRulesTuningAttacksService="props.wafTuning.listWafRulesTuningAttacksService"
          />
        </TabPanel>
        <TabPanel header="Allowed Rules">
          <ListWafRulesAllowed
            v-if="activeTab === mapTabs.allowed"
            :listWafRulesAllowedService="props.wafRulesAllowed.listWafRulesAllowedService"
            :deleteWafRulesAllowedService="props.wafRulesAllowed.deleteWafRulesAllowedService"
            :createWafRulesAllowedService="props.wafRulesAllowed.createWafRulesAllowedService"
            :loadWafRulesAllowedService="props.wafRulesAllowed.loadWafRulesAllowedService"
            :editWafRulesAllowedService="props.wafRulesAllowed.editWafRulesAllowedService"
            :documentationServiceAllowed="props.wafRulesAllowed.documentationServiceAllowed"
            :optionsRuleIds="props.wafRulesAllowed.optionsRuleIds"
            @handle-go-to-tuning="changeRouteByClickingOnTab"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
