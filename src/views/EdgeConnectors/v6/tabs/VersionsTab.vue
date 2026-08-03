<script setup>
  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'

  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'

  import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
  import { usePagedVersionList } from '@/composables/versioning/use-paged-version-list'
  import { useActiveVersions } from '@/composables/versioning/use-active-versions'
  import { getVersionListColumns } from '@/composables/versioning/version-list-columns'
  import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'

  defineOptions({ name: 'edge-connectors-v6-versions-tab' })

  const CONTROLS_DISABLED_TOOLTIP =
    'Search, filters and sorting are not available yet for version listings.'

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

  const resourceRef = computed(() => ({ resourceType: 'connector', resourceId: connectorId.value }))
  const { activeVersions, refresh: refreshActiveVersions } = useActiveVersions(resourceRef)

  const {
    items,
    totalRecords,
    paginatorFirst,
    pageSize,
    isLoading,
    isError,
    hasAnyVersions,
    filters,
    sortOptions,
    onPage,
    reload
  } = usePagedVersionList({
    versionService: edgeConnectorVersionService,
    resourceId: connectorId,
    activeVersions
  })

  const columns = getVersionListColumns()

  const goToVersion = (versionIdOrObject) => {
    const id = typeof versionIdOrObject === 'string' ? versionIdOrObject : versionIdOrObject?.id
    if (!id) return
    router.push(`/connectors/edit/${connectorId.value}/versions/${id}`)
  }

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
    onSuccess: () => {
      reload()
      refreshActiveVersions()
    }
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
      :loading="isLoading"
      :is-error="isError"
      :has-versions="hasAnyVersions"
      lazy
      :total-records="totalRecords"
      :paginator-first="paginatorFirst"
      :filters="filters"
      :sort-options="sortOptions"
      controls-disabled
      :controls-disabled-tooltip="CONTROLS_DISABLED_TOOLTIP"
      :show-row-actions="true"
      resource-type="connector"
      :paginator-rows="pageSize"
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
        buttonAction: () => reload()
      }"
      filtered-empty-title="No versions match your filters"
      filtered-empty-description="Try a different search term or status filter."
      data-testid="edge-connectors-v6-versions__table"
      @page="onPage"
      @refresh="reload()"
      @row-action="handleRowAction"
    >
      <template #toolbar-actions>
        <PrimeButton
          v-if="hasAnyVersions"
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
