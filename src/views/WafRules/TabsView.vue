<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/WafRules/EditView.vue'
  import ListWafRulesAllowed from '@/views/WafRules/ListWafRulesAllowed.vue'
  import ListWafRulesTuning from '@/views/WafRules/ListWafRulesTuning.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { ref, provide, reactive, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

  defineOptions({ name: 'tabs-waf-rules' })

  const props = defineProps({
    wafServices: { type: Object, required: true },
    wafRulesAllowed: { type: Object, required: true },
    wafTuning: { type: Object, required: true }
  })

  const mapTabs = ref({
    mainSettings: 0,
    tuning: 1,
    allowed: 2
  })

  const route = useRoute()
  const toast = useToast()
  const router = useRouter()
  const activeTab = ref(0)
  const wafRuleId = ref(route.params.id)
  const waf = ref()

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const getWafDat = async () => {
    try {
      return await props.wafServices.loadWafRulesService({ id: wafRuleId.value })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Processing failed',
        detail: error
      })
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

  const changeTab = (index) => {
    const tab = getTabFromValue(index)
    activeTab.value = index
    const params = {
      id: wafRuleId.value,
      tab
    }
    const { query } = route
    router.push({
      name: 'edit-waf-rules',
      params,
      query
    })
  }

  const title = ref('')

  const updateWafRulesValue = async (waf) => {
    title.value = waf.name
    waf.value = await getWafDat()
    formHasUpdated.value = false
  }

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    waf.value = await getWafDat()
    title.value = waf.value.name
    const activeTabIndexByRoute = mapTabs.value[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
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
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
        v-if="waf"
      >
        <TabPanel
          header="Main Settings"
          :pt="{
            root: { 'data-testid': 'waf-rules-tabs__tab__main-settings' }
          }"
        >
          <EditView
            v-if="activeTab === mapTabs.mainSettings"
            :updatedRedirect="props.wafServices.updatedRedirect"
            :editWafRulesService="props.wafServices.editWafRulesService"
            :waf="waf"
            :showActionBar="activeTab === mapTabs.mainSettings"
            @handleWafRulesUpdated="updateWafRulesValue"
            :isTab="true"
          />
        </TabPanel>
        <TabPanel
          header="Tuning"
          :pt="{
            root: { 'data-testid': 'waf-rules-tabs__tab__tuning' }
          }"
        >
          <ListWafRulesTuning
            v-if="activeTab === mapTabs.tuning"
            :documentationServiceTuning="props.wafTuning.documentationServiceTuning"
            :listWafRulesTuningService="props.wafTuning.listWafRulesTuningService"
            :listCountriesService="props.wafTuning.listCountriesService"
            :listNetworkListService="props.wafTuning.listNetworkListService"
            :listWafRulesDomainsService="props.wafTuning.listWafRulesDomainsService"
            :listDomainsService="props.wafTuning.listDomainsService"
            :showActionBar="activeTab === mapTabs.tuning"
            :createWafRulesAllowedTuningService="props.wafTuning.createWafRulesAllowedTuningService"
            :listWafRulesTuningAttacksService="props.wafTuning.listWafRulesTuningAttacksService"
            :loadDomainService="props.wafTuning.loadDomainService"
            :loadNetworkListService="props.wafTuning.loadNetworkListService"
          />
        </TabPanel>
        <TabPanel
          header="Allowed Rules"
          :pt="{
            root: { 'data-testid': 'waf-rules-tabs__tab__allowed-rules' }
          }"
        >
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
