<script setup>
  /**
   * VersionsTab — the version LISTING body of the v6 Applications screen.
   *
   * Lives inside the "Versions" outer tab of EditView. Lists every version of the
   * Application with search/filter/sort and per-row management actions
   * (Clone / Archive / Delete).
   *
   * Clicking a version opens its FULL editor (VersionEditView, route
   * `edit-application-version`). Clone / create / "New Version" navigate there too
   * (to the freshly created draft). The Application's quick "Settings" tab edits
   * only the Main Settings of the latest version — the full editor is reached from
   * here.
   *
   * Owns its own versions query (deduped by queryKey with the container's, so no
   * extra request). The page heading + Deploy action live in the container.
   */
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'

  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'

  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useVersionRowActions } from '@/composables/versioning/use-version-row-actions'

  defineOptions({ name: 'edge-applications-v6-versions-tab' })

  const props = defineProps({
    applicationId: {
      type: [String, Number],
      required: true
    }
  })

  const router = useRouter()
  const toast = useToast()

  const applicationId = computed(() => String(props.applicationId))
  const isCreatingDraft = ref(false)

  const versionsQuery = edgeAppVersionService.useListVersionsQuery(applicationId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  // Headless search/filter/sort. `items` is the derived, view-ready list; the
  // VersionListDataView renders its default `version`/`status`/`created` cells.
  const { items, searchTerm, filterValues, sort, filters, sortOptions } =
    useVersionList(rawVersions)

  const columns = [
    { key: 'version', label: 'Version' },
    { key: 'created', label: 'Created by' }
  ]

  // Opens the FULL editor (VersionEditView) for a specific version by navigating
  // to its route. Used by row clicks and by create/clone, so a freshly created
  // draft lands open for editing.
  const goToVersion = (versionIdOrObject) => {
    const id = typeof versionIdOrObject === 'string' ? versionIdOrObject : versionIdOrObject?.id
    if (!id) return
    router.push(`/applications/edit/${applicationId.value}/versions/${id}`)
  }

  // Row-level actions (Clone / Archive / Delete). Per-row eligibility is derived
  // from the version state machine inside VersionListDataView; execution runs
  // here via the service. A clone navigates to the new draft (onCloned).
  const {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    handleConfirm,
    handleVisibility
  } = useVersionRowActions({
    resourceId: applicationId,
    service: edgeAppVersionService,
    onCloned: goToVersion,
    onSuccess: () => versionsQuery.refetch?.()
  })

  // POST /versions without source_version → API clones the most recent `ready`, or
  // creates the first version if the app is not versioned yet. Navigates to the
  // new draft so the Settings tab opens it.
  const createDraft = async () => {
    if (isCreatingDraft.value) return
    isCreatingDraft.value = true
    try {
      const draft = await edgeAppVersionService.createDraft(applicationId.value, {})
      if (draft?.id) goToVersion(draft.id)
    } catch (err) {
      // A failed create is an action-scoped error: surface it as a toast and keep
      // the list mounted.
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
</script>

<template>
  <div data-testid="edge-applications-v6-versions-tab">
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
      :paginator-rows="10"
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
      data-testid="edge-applications-v6-versions__table"
      @update:search-term="searchTerm = $event"
      @update:filter-values="filterValues = $event"
      @update:sort="sort = $event"
      @refresh="versionsQuery.refetch?.()"
      @row-click="goToVersion"
      @row-action="handleRowAction"
    >
      <template #toolbar-actions>
        <PrimeButton
          v-if="rawVersions.length > 0"
          label="New Version"
          icon="pi pi-plus"
          size="small"
          :loading="isCreatingDraft"
          data-testid="edge-applications-v6-versions__new-draft"
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
  </div>
</template>
