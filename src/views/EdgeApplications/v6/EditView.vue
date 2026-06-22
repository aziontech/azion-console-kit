<script setup>
  /**
   * v6 EditView — the Application screen, gated by `use_v6_configurations`.
   * Lists every version of the Application with search/filter/sort and per-row
   * management actions (Clone / Archive / Delete). Clicking a version — or
   * creating/cloning one — opens its FULL editor (VersionEditView, route
   * `edit-application-version`). The page heading carries the Deploy action +
   * drawer.
   *
   * The flag check stays centralized in the router (req 10.1) — this view never
   * imports user-flag.
   */
  import { computed, ref, watch, provide } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'

  import { toDeployableVersionOptions } from '@/composables/versioning/to-version-options'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'

  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'

  defineOptions({ name: 'application-v6-edit-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const edgeApplicationId = computed(() => String(route.params.id))

  const application = ref(null)
  const isLoadingApplication = ref(true)
  const loadError = ref(null)

  provide('edgeApplication', application)

  const loadApplication = async () => {
    if (!application.value) isLoadingApplication.value = true
    loadError.value = null
    try {
      application.value = await edgeAppService.loadEdgeApplicationService({
        id: edgeApplicationId.value
      })
    } catch (err) {
      loadError.value = err
      application.value = null
    } finally {
      isLoadingApplication.value = false
    }
  }

  watch(edgeApplicationId, loadApplication, { immediate: true })

  const versionsQuery = edgeAppVersionService.useListVersionsQuery(edgeApplicationId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const { items, searchTerm, filterValues, sort, filters, sortOptions } =
    useVersionList(rawVersions)

  const columns = [
    { key: 'version', label: 'Version', size: 'minmax(220px, 1.4fr)' },
    { key: 'status', label: 'Status', size: 'minmax(140px, 0.8fr)' },
    { key: 'created', label: 'Created by', size: 'minmax(180px, 1.2fr)' }
  ]

  const goToVersion = (versionIdOrObject) => {
    const id = typeof versionIdOrObject === 'string' ? versionIdOrObject : versionIdOrObject?.id
    if (!id) return
    router.push(`/applications/edit/${edgeApplicationId.value}/versions/${id}`)
  }

  const isDeployDrawerOpen = ref(false)
  // Version pinned by a row-menu Promote; cleared when the drawer closes.
  const pinnedDeployVersionId = ref(null)
  const openDeployDrawer = () => {
    pinnedDeployVersionId.value = null
    isDeployDrawerOpen.value = true
  }
  // Promote from the row menu: open the release drawer with this version pinned.
  const openPromoteDrawer = ({ pin } = {}) => {
    pinnedDeployVersionId.value = pin ?? null
    isDeployDrawerOpen.value = true
  }
  watch(isDeployDrawerOpen, (open) => {
    if (!open) pinnedDeployVersionId.value = null
  })

  // Single shared row-menu driver (spec §3.3, Req 1.4/10.1): nav, Promote
  // (this view's drawer) and Archive/Delete all flow through one router.
  const {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    handleConfirm,
    handleVisibility
  } = useVersionMenuActions({
    resourceType: 'application',
    resourceId: edgeApplicationId,
    versionService: edgeAppVersionService,
    router,
    openPromoteDrawer,
    onSuccess: () => versionsQuery.refetch?.()
  })

  const isCreatingDraft = ref(false)

  const createDraft = async () => {
    if (isCreatingDraft.value) return
    isCreatingDraft.value = true
    try {
      const draft = await edgeAppVersionService.createDraft(edgeApplicationId.value, {})
      if (draft?.id) goToVersion(draft.id)
    } catch (err) {
      if (err && typeof err.showErrors === 'function') {
        err.showErrors(toast)
      } else {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: err?.message ?? 'Failed to create a new version. Try again.'
        })
      }
    } finally {
      isCreatingDraft.value = false
    }
  }

  const readyVersionOptions = computed(() => toDeployableVersionOptions(rawVersions.value))

  const deployResourceContext = computed(() => ({
    resourceType: 'application',
    resourceId: Number(edgeApplicationId.value),
    resourceName: application.value?.name ?? '',
    version: pinnedDeployVersionId.value ? { id: pinnedDeployVersionId.value } : null,
    versions: readyVersionOptions.value
  }))

  const applicationTitle = computed(() => application.value?.name ?? '')
  const pageDescription =
    "Each version is an isolated snapshot of this Application's configuration. Edit a draft, then build it to publish an immutable version to the Edge."
</script>

<template>
  <div
    v-if="isLoadingApplication"
    class="flex items-center justify-center p-8"
    data-testid="application-v6-edit__loading"
  >
    <ProgressSpinner
      class="w-10 h-10 text-color"
      strokeWidth="4"
    />
  </div>

  <InlineMessage
    v-else-if="loadError"
    class="w-full"
    severity="error"
    data-testid="application-v6-edit__error"
  >
    Failed to load application. Try refreshing the page.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="application-v6-edit"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="applicationTitle"
        :description="pageDescription"
        :entityName="application?.name"
      >
        <template #default>
          <PrimeButton
            label="Deploy"
            icon="pi pi-cloud-upload"
            size="small"
            data-testid="application-v6-edit__deploy"
            @click="openDeployDrawer"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <VersionListDataView
        :items="items"
        :columns="columns"
        :loading="versionsQuery.isLoading.value"
        :is-error="versionsQuery.isError?.value ?? false"
        :has-versions="rawVersions.length > 0"
        :search-term="searchTerm"
        :filters="filters"
        :filter-values="filterValues"
        :sort="sort"
        :sort-options="sortOptions"
        :show-row-actions="true"
        resource-type="application"
        :paginator-rows="20"
        search-placeholder="Search versions"
        :empty-state="{
          title: 'This application has no versions yet',
          description:
            'Create the first version to start configuring this application with the v6 versioning workflow.',
          buttonLabel: 'New Version',
          buttonAction: createDraft
        }"
        :error-state="{
          title: 'Failed to load versions',
          description: 'Something went wrong loading this application’s versions. Try again.',
          buttonLabel: 'Retry',
          buttonAction: () => versionsQuery.refetch?.()
        }"
        filtered-empty-title="No versions match your filters"
        filtered-empty-description="Try a different search term or status filter."
        data-testid="application-v6-versions__table"
        @update:search-term="searchTerm = $event"
        @update:filter-values="filterValues = $event"
        @update:sort="sort = $event"
        @refresh="versionsQuery.refetch?.()"
        @row-action="handleRowAction"
      >
        <template #toolbar-actions>
          <PrimeButton
            v-if="rawVersions.length > 0"
            label="New Version"
            icon="pi pi-plus"
            size="small"
            class="version-toolbar-action"
            :loading="isCreatingDraft"
            data-testid="application-v6-versions__new-draft"
            @click="createDraft"
          />
        </template>
      </VersionListDataView>

      <VersionActionDialog
        v-if="dialogConfig"
        v-bind="dialogProps"
        :visible="dialogVisible"
        @confirm="handleConfirm"
        @update:visible="handleVisibility"
      />

      <DeployDrawerBlock
        v-model:visible="isDeployDrawerOpen"
        :resource-context="deployResourceContext"
      />
    </template>
  </ContentBlock>
</template>

<style scoped>
  :deep(.version-toolbar-action.p-button) {
    height: 2.5rem;
  }
</style>
