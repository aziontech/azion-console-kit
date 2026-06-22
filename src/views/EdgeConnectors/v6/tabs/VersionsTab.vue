<script setup>
  // VersionsTab — the version LISTING body of the v6 Connectors screen.
  // Lists every version with search/filter/sort and per-row actions
  // (Clone / Archive / Delete). Clicking a version opens its full editor.
  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'

  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'

  import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'

  defineOptions({ name: 'edge-connectors-v6-versions-tab' })

  const props = defineProps({
    connectorId: {
      type: [String, Number],
      required: true
    }
  })

  const router = useRouter()
  const toast = useToast()

  const connectorId = computed(() => String(props.connectorId))
  const isCreatingDraft = ref(false)

  const versionsQuery = edgeConnectorVersionService.useListVersionsQuery(connectorId.value)
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
    router.push(`/connectors/edit/${connectorId.value}/versions/${id}`)
  }

  // The landing owns the release drawer; the tab only routes through the
  // single shared row-menu driver (spec §3.3/3.6, Req 1.4/10.1).
  const menuHost = inject('versionMenuHost', {})

  const {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    handleConfirm,
    handleVisibility
  } = useVersionMenuActions({
    resourceType: 'connector',
    resourceId: connectorId,
    versionService: edgeConnectorVersionService,
    router,
    openPromoteDrawer: menuHost.openPromoteDrawer,
    onSuccess: () => versionsQuery.refetch?.()
  })

  const createDraft = async () => {
    if (isCreatingDraft.value) return
    isCreatingDraft.value = true
    try {
      const draft = await edgeConnectorVersionService.createDraft(connectorId.value, {})
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
</script>

<template>
  <div data-testid="edge-connectors-v6-versions-tab">
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
      resource-type="connector"
      :paginator-rows="20"
      search-placeholder="Search versions"
      :empty-state="{
        title: 'This connector has no versions yet',
        description:
          'Create the first version to start configuring this connector with the v6 versioning workflow.',
        buttonLabel: 'New Version',
        buttonAction: createDraft
      }"
      :error-state="{
        title: 'Failed to load versions',
        description: 'Something went wrong loading this connector versions. Try again.',
        buttonLabel: 'Retry',
        buttonAction: () => versionsQuery.refetch?.()
      }"
      filtered-empty-title="No versions match your filters"
      filtered-empty-description="Try a different search term or status filter."
      data-testid="edge-connectors-v6-versions__table"
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
          :loading="isCreatingDraft"
          data-testid="edge-connectors-v6-versions__new-draft"
          @click="createDraft"
          class="h-[2.5rem]"
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
