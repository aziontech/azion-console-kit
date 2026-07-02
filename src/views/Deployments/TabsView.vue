<script setup>
  import { ref, computed, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import PrimeButton from '@aziontech/webkit/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import VersionsTab from '@/views/Deployments/tabs/VersionsTab.vue'
  import ReleasesTab from '@/views/Deployments/tabs/ReleasesTab.vue'
  import { loadDeploymentByIdAdapter } from '@/views/Deployments/Config/adapters'
  import { releaseComposerRouteFromDeployment } from '@/templates/release-composition/release-composer-route'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  defineOptions({ name: 'tabs-deployments-edit' })

  const TAB_ORDER = ['versions', 'releases']
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

  const initialTabName = TAB_ORDER.includes(route.params.tab) ? route.params.tab : 'versions'
  const activeTab = ref(TAB_TO_INDEX[initialTabName])

  if (route.params.tab !== initialTabName) {
    router.replace({
      name: 'deployments-edit',
      params: { id: deploymentId.value, tab: initialTabName },
      query: route.query
    })
  }

  const tabViewRef = ref(null)

  const indexToTabName = (index) => TAB_ORDER[index] || TAB_ORDER[0]

  const changeTab = (index) => {
    activeTab.value = index
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

  const isDeployDrawerOpen = ref(false)
  const releasesRefreshKey = ref(0)

  const openRelease = () => {
    router.push(releaseComposerRouteFromDeployment(deploymentId.value))
  }

  const onDeployed = () => {
    releasesRefreshKey.value += 1
    if (activeTab.value !== TAB_TO_INDEX.releases) {
      changeTab(TAB_TO_INDEX.releases)
    }
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
      deployment.value = {}
    } finally {
      isLoading.value = false
    }
  }

  fetchDeployment()
</script>

<template>
  <ContentBlock data-testid="deployments-edit-content-block">
    <template #heading>
      <PageHeadingBlock
        :pageTitle="deploymentName"
        :entityName="deploymentName"
        description="View and manage the versions and releases of this deployment."
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
          header="Versions"
          :pt="{ root: { 'data-testid': 'deployments-edit-tabs__tab__versions' } }"
        >
          <VersionsTab
            v-if="activeTab === TAB_TO_INDEX.versions"
            :deploymentId="deploymentId"
            class="mt-4"
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
      </TabView>

      <DeployDrawerBlock
        v-model:visible="isDeployDrawerOpen"
        :preselected-deployment-id="deploymentId"
        @deployed="onDeployed"
      />
    </template>
  </ContentBlock>
</template>
