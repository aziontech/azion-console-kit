<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { ref, provide, reactive, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import EditView from './EditView.vue'
  import { workloadService } from '@/services/v2'

  defineOptions({ name: 'tabs-workloads' })

  const props = defineProps({
    updatedRedirect: { type: String, required: true },
    edgeApplicationServices: { type: Object, required: true },
    edgeFirewallServices: { type: Object, required: true },
    digitalCertificatesServices: { type: Object, required: true },
    customPagesServices: { type: Object, required: true }
  })

  const mapTabs = ref({
    mainSettings: 0
  })

  const route = useRoute()
  const toast = useToast()
  const router = useRouter()
  const activeTab = ref(0)
  const workloadId = ref(route.params.id)
  const workload = ref()

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const getWorkload = async () => {
    try {
      return await workloadService.loadWorkload({ id: workloadId.value })
    } catch (error) {
      error.showWithOptions(toast, {
        summary: 'Processing failed',
        detail: error
      })
      return {}
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
      id: workloadId.value,
      tab
    }
    const { query } = route
    router.push({
      name: 'edit-workload',
      params,
      query
    })
  }

  const title = ref('')

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    workload.value = await getWorkload()
    title.value = workload.value.name
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
      <PageHeadingBlock
        :pageTitle="title"
        :tag="tagLocked"
      />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
        v-if="workload"
      >
        <TabPanel
          header="Main Settings"
          :pt="{
            root: { 'data-testid': 'workload-tabs__tab__main-settings' }
          }"
        >
          <EditView
            v-if="activeTab === mapTabs.mainSettings"
            :updatedRedirect="props.domainServices.updatedRedirect"
            :editDomainService="props.domainServices.editDomainService"
            :loadDigitalCertificatesService="props.domainServices.loadDigitalCertificatesService"
            :clipboardWrite="props.domainServices.clipboardWrite"
            :domain="domain"
            :showActionBar="activeTab === mapTabs.mainSettings"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
