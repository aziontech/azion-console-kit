<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditView from '@/views/EdgeFirewall/EditView'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import TabView from 'primevue/tabview'
  import EdgeFirewallFunctionsListView from '@/views/EdgeFirewallFunctions/ListView'
  import EdgeFirewallRulesEngineListView from '@/views/EdgeFirewallRulesEngine/ListView'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { edgeFirewallFunctionService } from '@/services/v2/edge-firewall/edge-firewall-function-service'
  import { edgeFirewallRulesEngineService } from '@/services/v2/edge-firewall/edge-firewall-rules-engine-service'
  import { computed, ref, onMounted, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'
  import EditViewSkeleton from './components/EditViewSkeleton.vue'

  const breadcrumbs = useBreadcrumbs()
  const tableDefinitionsStore = useTableDefinitionsStore()
  const pageSize = tableDefinitionsStore.getNumberOfLinesPerPage || 10

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

  const componentsRefs = ref(null)

  const tabs = ref([
    {
      header: 'Main Settings',
      component: EditView,
      condition: true,
      show: () => mapTabs.value.mainSettings === activeTab.value,
      props: () => ({
        edgeFirewall: edgeFirewall.value,
        initialValues: edgeFirewall.value,
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
      addButtonLabel: 'Function',
      props: () => ({
        ...props.edgeFirewallServices,
        edgeFirewallID: edgeFirewallId.value
      })
    },
    {
      header: 'Rules Engine',
      component: EdgeFirewallRulesEngineListView,
      condition: true,
      showAddButtonTab: true,
      addButtonLabel: 'Rule',
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
      label: tab?.addButtonLabel || tab?.header || 'Create',
      click: () => componentsRefs.value?.[0]?.openCreateDrawer?.()
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

  const verifyTab = (firewall) => {
    if (!firewall) return

    const { edgeFunctionsEnabled } = firewall
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

  const preloadTabData = () => {
    if (!edgeFirewall.value) return

    const promises = []

    if (edgeFirewall.value.edgeFunctionsEnabled) {
      promises.push(
        edgeFirewallFunctionService.prefetchFunctionsList(edgeFirewallId.value, pageSize)
      )
    }

    promises.push(edgeFirewallRulesEngineService.prefetchRulesEngineList(edgeFirewallId.value))

    Promise.allSettled(promises)
  }

  const renderTabCurrentRouter = async () => {
    const { tab } = route.params

    let selectedTab = tab
    if (!selectedTab) selectedTab = 'mainSettings'

    const activeTabIndexByRoute = mapTabs.value[selectedTab]
    changeTab(activeTabIndexByRoute)

    edgeFirewall.value = { ...edgeFirewall.value, ...(await loaderEdgeFirewall()) }
    verifyTab(edgeFirewall.value)

    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeFirewall.value?.name)
    preloadTabData()
  }

  // --- Cache from listing ---

  const cachedFirewall = edgeFirewallService.getFirewallFromCache(edgeFirewallId.value)

  if (cachedFirewall?.name) {
    edgeFirewall.value = cachedFirewall
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, cachedFirewall.name)
  }

  const title = computed(() => {
    return edgeFirewall.value?.name || ''
  })

  const shouldShowSkeleton = computed(() => {
    if (!edgeFirewall.value) return true
    return false
  })

  const updatedFirewall = (firewall) => {
    edgeFirewall.value = { ...edgeFirewall.value, ...firewall }
    verifyTab(edgeFirewall.value)
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeFirewall.value?.name)
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

  const { unsaved, requestTabChange } = provideTabUnsaved(changeTab)

  const tabViewRef = ref(null)

  const handleTabClick = ({ index = 0 }) => {
    requestTabChange(activeTab.value, index)
    if (unsaved.isDialogVisible.value && tabViewRef.value) {
      nextTick(() => {
        tabViewRef.value.d_activeIndex = activeTab.value
      })
    }
  }
</script>

<template>
  <EditViewSkeleton v-if="shouldShowSkeleton" />
  <ContentBlock v-else>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :entityName="edgeFirewall?.name"
        description="Configure security logic and enforcement settings applied to incoming workload requests."
      />
    </template>
    <template #content>
      <DialogUnsaved
        :visible="unsaved.isDialogVisible.value"
        @leave="unsaved.confirmLeave"
        @stay="unsaved.cancelLeave"
      />
      <div class="h-full w-full">
        <div class="flex align-center justify-between relative">
          <TabView
            ref="tabViewRef"
            :activeIndex="activeTab"
            @tab-click="handleTabClick"
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
