<script setup>
  import { ref, computed, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import EditViewSkeleton from './components/EditViewSkeleton.vue'
  import EditView from './EditView.vue'
  import OverviewTab from './Tabs/OverviewTab.vue'
  import DeploymentsListSection from './Tabs/sections/DeploymentsListSection.vue'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  defineOptions({ name: 'tabs-workloads' })

  const props = defineProps({
    updatedRedirect: { type: String, required: true }
  })

  const TAB_ORDER = ['overview', 'deployment', 'settings']
  const TAB_TO_INDEX = TAB_ORDER.reduce((acc, name, index) => {
    acc[name] = index
    return acc
  }, {})

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()

  const workloadId = ref(route.params.id)
  const cachedWorkload = workloadService.getWorkloadFromCache(workloadId.value) ?? null
  const workload = ref(cachedWorkload)
  const isLoading = ref(!cachedWorkload)

  if (cachedWorkload?.name) {
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, cachedWorkload.name)
  }

  const initialTabName = TAB_ORDER.includes(route.params.tab) ? route.params.tab : 'overview'
  const activeTab = ref(TAB_TO_INDEX[initialTabName])

  if (route.params.tab !== initialTabName) {
    router.replace({
      name: 'edit-workload',
      params: { id: route.params.id, tab: initialTabName },
      query: route.query
    })
  }

  const tabViewRef = ref(null)

  const indexToTabName = (index) => TAB_ORDER[index] || TAB_ORDER[0]

  const changeTab = (index) => {
    activeTab.value = index
    router.replace({
      name: 'edit-workload',
      params: {
        id: workloadId.value,
        tab: indexToTabName(index)
      },
      query: route.query
    })
  }

  const { unsaved, requestTabChange } = provideTabUnsaved(changeTab)

  const handleTabClick = ({ index = 0 }) => {
    if (index === activeTab.value) return
    requestTabChange(activeTab.value, index)
    if (unsaved.isDialogVisible.value && tabViewRef.value) {
      nextTick(() => {
        tabViewRef.value.d_activeIndex = activeTab.value
      })
    }
  }

  const fetchWorkload = async () => {
    isLoading.value = true
    try {
      const data = await workloadService.loadWorkload({ id: workloadId.value })
      workload.value = data
      if (data?.name) {
        breadcrumbs.update(route.meta.breadCrumbs ?? [], route, data.name)
      }
    } catch (error) {
      error?.showWithOptions?.(toast, {
        summary: 'Processing failed',
        detail: error
      })
      workload.value = {}
    } finally {
      isLoading.value = false
    }
  }

  const setWorkloadName = (next) => {
    if (!next?.name) return
    workload.value = { ...(workload.value || {}), name: next.name }
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, next.name)
  }

  const workloadName = computed(() => workload.value?.name || '')

  fetchWorkload()
</script>

<template>
  <EditViewSkeleton v-if="isLoading" />
  <ContentBlock v-else>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="workloadName"
        :entityName="workloadName"
        description="Configure domains, protocols, certificates, and select the security and application settings executed by this Workload."
      >
      </PageHeadingBlock>
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
        class="w-full h-full"
        @tab-click="handleTabClick"
      >
        <TabPanel
          header="Overview"
          :pt="{ root: { 'data-testid': 'workload-tabs__tab__overview' } }"
        >
          <OverviewTab
            v-if="activeTab === TAB_TO_INDEX.overview"
            :workloadId="workloadId"
            :workload="workload"
          />
        </TabPanel>
        <TabPanel
          header="Deployment"
          :pt="{ root: { 'data-testid': 'workload-tabs__tab__deployment' } }"
        >
          <DeploymentsListSection
            v-if="activeTab === TAB_TO_INDEX['deployment']"
            :workloadId="workloadId"
          />
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{ root: { 'data-testid': 'workload-tabs__tab__settings' } }"
        >
          <EditView
            v-if="activeTab === TAB_TO_INDEX['settings']"
            :updatedRedirect="props.updatedRedirect"
            :embeddedInTabs="true"
            @loaded-service-object="setWorkloadName"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
