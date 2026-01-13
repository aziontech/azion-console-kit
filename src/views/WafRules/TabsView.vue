<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/WafRules/EditView.vue'
  import ListWafRulesAllowed from '@/views/WafRules/ListWafRulesAllowed.vue'
  import ListWafRulesTuning from '@/views/WafRules/ListWafRulesTuning.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'
  import { ref, provide, reactive, watch, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { wafService } from '@/services/v2/waf/waf-service'

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

  const componentsRefs = ref(null)

  const addButtonController = computed(() => {
    const isAllowedRulesTab = activeTab.value === mapTabs.value.allowed
    return {
      showAddButtonTab: isAllowedRulesTab,
      label: 'Allowed Rule',
      click: () => componentsRefs.value?.openCreateDrawer?.()
    }
  })

  const getWafDat = async () => {
    try {
      return await wafService.loadWafRule({ id: wafRuleId.value })
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Processing failed',
          detail: error.message || error
        })
      }
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
      <PageHeadingBlock :pageTitle="title" description="Configure threat detection types and allow rules evaluated by Firewall rules engine." />
    </template>
    <template #content>
      <div
        class="flex align-center justify-between relative"
        v-if="waf"
      >
        <TabView
          :activeIndex="activeTab"
          @tab-click="changeRouteByClickingOnTab"
          class="flex-1"
        >
          <TabPanel
            header="Main Settings"
            :pt="{
              root: { 'data-testid': 'waf-rules-tabs__tab__main-settings' }
            }"
          >
          </TabPanel>
          <TabPanel
            header="Tuning"
            :pt="{
              root: { 'data-testid': 'waf-rules-tabs__tab__tuning' }
            }"
          >
          </TabPanel>
          <TabPanel
            header="Allowed Rules"
            :pt="{
              root: { 'data-testid': 'waf-rules-tabs__tab__allowed-rules' }
            }"
          >
          </TabPanel>
        </TabView>
        <div
          v-if="addButtonController.showAddButtonTab"
          class="flex ml-4 items-center"
        >
          <PrimeButton
            :label="addButtonController.label"
            size="small"
            icon="pi pi-plus"
            @click="addButtonController.click"
            data-testid="waf-rules-allowed-add-button"
          />
        </div>
      </div>

      <div v-if="waf">
        <EditView
          v-if="activeTab === mapTabs.mainSettings"
          :updatedRedirect="props.wafServices.updatedRedirect"
          :waf="waf"
          :showActionBar="activeTab === mapTabs.mainSettings"
          @handleWafRulesUpdated="updateWafRulesValue"
          :isTab="true"
        />
        <ListWafRulesTuning
          v-if="activeTab === mapTabs.tuning"
          :documentationServiceTuning="props.wafTuning.documentationServiceTuning"
          :listWafRulesTuningService="props.wafTuning.listWafRulesTuningService"
          :listCountriesService="props.wafTuning.listCountriesService"
          :listWafRulesDomainsService="props.wafTuning.listWafRulesDomainsService"
          :listDomainsService="props.wafTuning.listDomainsService"
          :showActionBar="activeTab === mapTabs.tuning"
          :listWafRulesTuningAttacksService="props.wafTuning.listWafRulesTuningAttacksService"
          :loadDomainService="props.wafTuning.loadDomainService"
        />
        <ListWafRulesAllowed
          ref="componentsRefs"
          v-if="activeTab === mapTabs.allowed"
          :documentationServiceAllowed="props.wafRulesAllowed.documentationServiceAllowed"
          @handle-go-to-tuning="changeRouteByClickingOnTab"
        />
      </div>
    </template>
  </ContentBlock>
</template>
