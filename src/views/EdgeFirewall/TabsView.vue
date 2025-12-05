<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/EdgeFirewall/EditView'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import EdgeFirewallFunctionsListView from '@/views/EdgeFirewallFunctions/ListView'
  import EdgeFirewallRulesEngineListView from '@/views/EdgeFirewallRulesEngine/ListView'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { computed, ref, watch, provide, reactive, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  const breadcrumbs = useBreadcrumbs()

  defineOptions({ name: 'tabs-edge-firewall' })

  const props = defineProps({
    edgeFirewallServices: { type: Object, required: true },
    listDomainsService: { type: Function, required: true },
    rulesEngineServices: { type: Object, required: true }
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

  const componentsRefs = ref(null)

  const tabs = ref([
    {
      header: 'Main Settings',
      component: EditView,
      condition: true,
      show: () => mapTabs.value.mainSettings === activeTab.value,
      props: () => ({
        edgeFirewall: edgeFirewall.value,
        loadDomains: props.listDomainsService,
        updatedRedirect: props.edgeFirewallServices.updatedRedirect,
        isTab: true
      })
    },
    {
      header: 'Functions Instances',
      component: EdgeFirewallFunctionsListView,
      condition: () => edgeFirewall.value?.edgeFunctionsEnabled,
      show: () => activeTab.value === mapTabs.value.functions,
      showAddButtonTab: true,
      props: () => ({
        ...props.edgeFirewallServices,
        edgeFirewallID: edgeFirewallId.value
      })
    },
    {
      header: 'Rules Engine',
      component: EdgeFirewallRulesEngineListView,
      condition: true,
      show: () => activeTab.value === mapTabs.value.rulesEngine,
      props: () => ({
        edgeFirewallId: edgeFirewallId.value,
        ...props.rulesEngineServices
      })
    }
  ])

  const filteredTabs = computed(() => {
    return tabs.value.filter((tab) => {
      return typeof tab.condition === 'function' ? tab.condition() : tab.condition
    })
  })

  const addButtonController = computed(() => {
    const tab = filteredTabs.value[activeTab.value]
    return {
      showAddButtonTab: !!tab?.showAddButtonTab,
      label: tab?.header || 'Create',
      click: () => componentsRefs.value[0].openCreateDrawer?.()
    }
  })

  const loaderEdgeFirewall = async () => {
    try {
      return await edgeFirewallService.loadEdgeFirewallService({
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

    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeFirewall.value?.name)

    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  const title = computed(() => {
    return edgeFirewall.value?.name || ''
  })

  const updatedFirewall = (firewall) => {
    edgeFirewall.value = { ...firewall }
    verifyTab(edgeFirewall.value)
  }

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
      name: 'edit-firewall',
      params,
      query: route.query
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
      <PageHeadingBlock
        :pageTitle="title"
        :entityName="edgeFirewall?.name"
      />
    </template>
    <template #content>
      <div
        class="h-full w-full"
        v-if="edgeFirewall"
      >
        <div class="flex align-center justify-between relative">
          <TabView
            :activeIndex="activeTab"
            @tab-click="changeRouteByClickingOnTab"
            class="flex-1"
          >
            <TabPanel
              v-for="(tab, index) in filteredTabs"
              :pt="{
                headerAction: {
                  id: `tab_${index}`
                },
                root: {
                  'data-testid': `edge-firewall-details-tab-panel__${tab.header}__tab`,
                  id: `${tab.header}`
                }
              }"
              :key="index"
              :header="tab.header"
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
              data-testid="data-table-actions-column-body-actions-menu-button"
            />
          </div>
        </div>

        <!-- Tab Content -->
        <div>
          <template
            v-for="(tab, index) in filteredTabs"
            :key="index"
          >
            <component
              ref="componentsRefs"
              :is="tab.component"
              v-if="tab.show()"
              @updatedFirewall="updatedFirewall"
              v-bind="tab.props()"
            />
          </template>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>
