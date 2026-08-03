<script setup>
  import { ref, computed, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import PrimeButton from '@aziontech/webkit/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import EditViewSkeleton from '@/views/Deployments/components/EditViewSkeleton.vue'
  import SettingsTab from '@/views/Deployments/tabs/SettingsTab.vue'
  import ReleasesTab from '@/views/Deployments/tabs/ReleasesTab.vue'
  import VersionHistoryTab from '@/views/Deployments/tabs/VersionHistoryTab.vue'
  import { loadDeploymentByIdAdapter } from '@/views/Deployments/Config/adapters'
  import { releaseComposerRouteFromDeployment } from '@/templates/release-composition/release-composer-route'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  defineOptions({ name: 'tabs-deployments-edit' })

  const TAB_ORDER = ['settings', 'releases', 'version-history']
  const TAB_TO_INDEX = TAB_ORDER.reduce((acc, name, index) => {
    acc[name] = index
    return acc
  }, {})

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()

  const deploymentId = ref(String(route.params.id))
  const deployment = ref(null)
  const isLoading = ref(true)

  const releasesRefreshKey = ref(0)
  const historyRefreshKey = ref(0)

  const activeTab = computed(() => {
    const tabName = TAB_ORDER.includes(route.params.tab) ? route.params.tab : 'settings'
    return TAB_TO_INDEX[tabName]
  })

  const tabViewRef = ref(null)

  const indexToTabName = (index) => TAB_ORDER[index] || TAB_ORDER[0]

  const changeTab = (index) => {
    router.replace({
      name: 'deployments-edit',
      params: { id: deploymentId.value, tab: indexToTabName(index) },
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

  const deploymentName = computed(() => deployment.value?.name || '')

  const openRelease = () => {
    router.push(releaseComposerRouteFromDeployment(deploymentId.value))
  }

  const fetchDeployment = async () => {
    isLoading.value = true
    try {
      const data = await loadDeploymentByIdAdapter({ id: deploymentId.value })
      deployment.value = data
      if (data?.name) {
        breadcrumbs.update(route.meta.breadCrumbs ?? [], route, data.name)
      }
    } catch (error) {
      error?.showWithOptions?.(toast, {
        summary: 'Processing failed',
        detail: error
      })
      deployment.value = null
    } finally {
      isLoading.value = false
    }
  }

  const onUpdated = async () => {
    await fetchDeployment()
    historyRefreshKey.value += 1
  }

  fetchDeployment()
</script>

<template>
  <EditViewSkeleton v-if="isLoading" />

  <ContentBlock
    v-else-if="deployment"
    data-testid="deployments-edit-content-block"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="deploymentName"
        :entityName="deploymentName"
        description="View and manage the settings, releases, and version history of this deployment."
        data-testid="deployments-edit-heading"
      >
        <template #default>
          <PrimeButton
            label="Deploy"
            icon="pi pi-cloud-upload"
            size="small"
            data-testid="deployments-edit__deploy"
            @click="openRelease"
          />
        </template>
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
          header="Settings"
          :pt="{ root: { 'data-testid': 'deployments-edit-tabs__tab__settings' } }"
        >
          <SettingsTab
            v-if="activeTab === TAB_TO_INDEX.settings"
            :deployment="deployment"
            @updated="onUpdated"
          />
        </TabPanel>
        <TabPanel
          header="Releases"
          :pt="{ root: { 'data-testid': 'deployments-edit-tabs__tab__releases' } }"
        >
          <ReleasesTab
            v-if="activeTab === TAB_TO_INDEX.releases"
            :key="releasesRefreshKey"
            :deploymentId="deploymentId"
          />
        </TabPanel>
        <TabPanel
          header="Version history"
          :pt="{ root: { 'data-testid': 'deployments-edit-tabs__tab__version-history' } }"
        >
          <VersionHistoryTab
            v-if="activeTab === TAB_TO_INDEX['version-history']"
            :key="historyRefreshKey"
            :deploymentId="deploymentId"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
