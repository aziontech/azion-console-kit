<script setup>
  import { ref, computed, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  // import { DataTableActionsButtons } from '@/components/list-table'
  import EditViewSkeleton from './components/EditViewSkeleton.vue'
  import OverviewTab from './Tabs/OverviewTab.vue'
  import VersionsTab from './Tabs/VersionsTab.vue'
  import CreateDeploymentVersionDrawer from './FormFields/components/CreateDeploymentVersionDrawer.vue'
  import WorkloadSettingsTab from './v6/WorkloadSettingsTab.vue'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { workloadVersionService } from '@/services/v2/workload/workload-version-service'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'

  defineOptions({ name: 'tabs-workloads' })

  defineProps({
    updatedRedirect: { type: String, required: true }
  })

  const TAB_ORDER = ['overview', 'versions', 'settings']
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

  const workloadName = computed(() => workload.value?.name || '')

  // Versions of this Workload, used to resolve the latest one the Settings tab
  // edits inside the VersionShell. Deduped by queryKey with VersionsTab.
  const versionsQuery = workloadVersionService.useListVersionsQuery(workloadId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])
  const latestVersionId = computed(() => {
    const list = rawVersions.value
    if (!list.length) return null
    const sorted = [...list].sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    )
    return sorted[0]?.id ?? null
  })

  const SUCCESS_SUMMARY = {
    [VERSION_ACTIONS.SAVE]: 'Versão salva',
    [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build iniciado',
    [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelado',
    [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Rascunho criado',
    [VERSION_ACTIONS.ARCHIVE]: 'Versão arquivada',
    [VERSION_ACTIONS.DELETE]: 'Versão excluída'
  }

  const handleSettingsCancel = () => changeTab(TAB_TO_INDEX['versions'])

  const handleSettingsCommandSuccess = ({ action, result }) => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: SUCCESS_SUMMARY[action] ?? 'Concluído'
    })

    switch (action) {
      case VERSION_ACTIONS.DELETE:
      case VERSION_ACTIONS.SAVE_AND_BUILD:
        changeTab(TAB_TO_INDEX['versions'])
        return
      case VERSION_ACTIONS.NEW_DRAFT_FROM:
        if (result?.id) {
          router.push({
            name: 'edit-workload-version',
            params: { id: workloadId.value, versionId: result.id }
          })
        }
        return
      case VERSION_ACTIONS.SAVE:
        fetchWorkload()
        return
      default:
    }
  }

  const handleSettingsCommandError = ({ error }) => {
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }
    const detail = error?.message ?? (typeof error === 'string' ? error : 'Something went wrong')
    toast.add({ closable: true, severity: 'error', summary: 'Error', detail })
  }

  const createDrawerVisible = ref(false)

  const onVersionCreated = () => {
    if (activeTab.value !== TAB_TO_INDEX['versions']) {
      changeTab(TAB_TO_INDEX['versions'])
    }
  }

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
        <template #default>
          <!-- Teleport target for the version's status + lifecycle action on the
               Settings tab (Build when draft). -->
          <div
            id="version-lifecycle-action"
            class="flex items-center"
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
          header="Versions"
          :pt="{ root: { 'data-testid': 'workload-tabs__tab__versions' } }"
        >
          <div class="mt-4">
            <VersionsTab
              v-if="activeTab === TAB_TO_INDEX['versions']"
              :workloadId="workloadId"
            />
          </div>
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{ root: { 'data-testid': 'workload-tabs__tab__settings' } }"
        >
          <template v-if="activeTab === TAB_TO_INDEX['settings']">
            <WorkloadSettingsTab
              v-if="latestVersionId && workload"
              :key="latestVersionId"
              :workload="workload"
              :resource-id="workloadId"
              :version-id="latestVersionId"
              @command-success="handleSettingsCommandSuccess"
              @command-error="handleSettingsCommandError"
              @cancel="handleSettingsCancel"
            />
            <div
              v-else
              class="mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-16 text-center text-[var(--text-color-secondary)]"
              data-testid="workload-tabs__settings-empty"
            >
              <i class="pi pi-file-edit text-2xl text-[var(--text-color-secondary)]" />
              <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
                Nenhuma versão para editar
              </h3>
              <p class="m-0 max-w-md text-sm leading-6">
                Crie uma versão na aba Versions para configurar este Workload.
              </p>
            </div>
          </template>
        </TabPanel>
      </TabView>

      <CreateDeploymentVersionDrawer
        v-model:visible="createDrawerVisible"
        :workload="workload"
        :workloadDeploymentId="workload?.workloadDeploymentId"
        @save="onVersionCreated"
      />
    </template>
  </ContentBlock>
</template>
