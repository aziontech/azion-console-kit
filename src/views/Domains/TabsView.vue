<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DeploymentView from './DeploymentView.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { ref, provide, reactive, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import EditView from './EditView.vue'
  defineOptions({ name: 'tabs-domains' })

  const props = defineProps({
    domainServices: { type: Object, required: true },
    workloadDeploymentServices: { type: Object, required: true }
  })

  const mapTabs = ref({
    mainSettings: 0,
    deployment: 1
  })

  const route = useRoute()
  const toast = useToast()
  const router = useRouter()
  const activeTab = ref(0)
  const domainId = ref(route.params.id)
  const domain = ref()

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const getDomain = async () => {
    try {
      return await props.domainServices.loadDomainService({ id: domainId.value })
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
      id: domainId.value,
      tab
    }
    const { query } = route
    router.push({
      name: 'edit-domain',
      params,
      query
    })
  }

  const title = ref('')

  const updateDomainValue = async (value) => {
    title.value = value.name
    domain.value = await getDomain()
    formHasUpdated.value = false
  }

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    domain.value = await getDomain()
    title.value = domain.value.name
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
        v-if="domain"
      >
        <TabPanel
          header="Main Settings"
          :pt="{
            root: { 'data-testid': 'domain-tabs__tab__main-settings' }
          }"
        >
          <EditView
            v-if="activeTab === mapTabs.mainSettings"
            :updatedRedirect="props.domainServices.updatedRedirect"
            :editDomainService="props.domainServices.editDomainService"
            :listDigitalCertificatesService="props.domainServices.listDigitalCertificatesService"
            :loadDigitalCertificatesService="props.domainServices.loadDigitalCertificatesService"
            :clipboardWrite="props.domainServices.clipboardWrite"
            :domain="domain"
            :showActionBar="activeTab === mapTabs.mainSettings"
            @handleDomainUpdated="updateDomainValue"
          />
        </TabPanel>
        <TabPanel
          header="Deployment"
          :pt="{
            root: { 'data-testid': 'domain-tabs__tab__deployment' }
          }"
        >
          <DeploymentView
            v-if="activeTab === mapTabs.deployment"
            :listEdgeApplicationsService="
              props.workloadDeploymentServices.listEdgeApplicationsService
            "
            :loadEdgeApplicationsService="
              props.workloadDeploymentServices.loadEdgeApplicationsService
            "
            :listEdgeFirewallService="props.workloadDeploymentServices.listEdgeFirewallService"
            :loadEdgeFirewallService="props.workloadDeploymentServices.loadEdgeFirewallService"
            :editWorkloadDeploymentService="
              props.workloadDeploymentServices.editWorkloadDeploymentService
            "
            :listWorkloadDeployment="props.workloadDeploymentServices.listWorkloadDeploymentService"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
