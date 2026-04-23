<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditViewSkeleton from './components/EditViewSkeleton.vue'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { ref, computed, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import EditView from './EditView.vue'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'

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

  const title = ref('')

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    workload.value = await getWorkload()
    title.value = workload.value.name
    const activeTabIndexByRoute = mapTabs.value[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  const shouldShowSkeleton = computed(() => {
    if (!workload.value) return true
    return false
  })

  renderTabCurrentRouter()
</script>

<template>
  <EditViewSkeleton v-if="shouldShowSkeleton" />
  <ContentBlock v-else>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :tag="tagLocked"
      />
    </template>
    <template #content>
      <DialogUnsaved
        :visible="unsaved.isDialogVisible.value"
        @leave="unsaved.confirmLeave"
        @stay="unsaved.cancelLeave"
      />
      <TabView
        ref="tabViewRef"
        :activeIndex="activeTab"
        @tab-click="handleTabClick"
        class="w-full h-full"
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
            :domain="domain"
            :showActionBar="activeTab === mapTabs.mainSettings"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
