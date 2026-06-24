<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'
  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'
  import { deploymentVersionService } from '@/services/v2/deployment/deployment-version-service'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'
  import '@/assets/styles/version-row-menu.css'

  defineOptions({ name: 'deployment-v6-versions-tab' })

  const props = defineProps({
    deploymentId: {
      type: [String, Number],
      required: true
    }
  })

  const router = useRouter()
  const toast = useToast()
  const deploymentId = computed(() => String(props.deploymentId))

  const versionsQuery = deploymentVersionService.useListVersionsQuery(deploymentId)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const { items, searchTerm, filterValues, sort, filters, sortOptions } = useVersionList(
    rawVersions,
    { searchableFields: ['id', 'name', 'state', 'comment'] }
  )

  const columns = [
    { key: 'version', label: 'Version', size: 'minmax(220px, 1.4fr)' },
    { key: 'status', label: 'Status', size: 'minmax(140px, 0.8fr)' },
    { key: 'created', label: 'Created by', size: 'minmax(180px, 1.2fr)' }
  ]

  // Single shared driver: routes row-action through the same composable and renders
  // the same model as every other version listing, so the menu can never diverge.
  const {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    handleConfirm,
    handleVisibility
  } = useVersionMenuActions({
    resourceType: 'deployment',
    resourceId: deploymentId,
    versionService: deploymentVersionService,
    router,
    onSuccess: () => versionsQuery.refetch?.()
  })

  const isCreatingDraft = ref(false)

  const createDraft = async () => {
    if (isCreatingDraft.value) return
    isCreatingDraft.value = true
    try {
      const draft = await deploymentVersionService.createDraft(deploymentId.value, {})
      if (draft?.id) {
        router.push({
          name: 'edit-deployment-version',
          params: { id: deploymentId.value, versionId: String(draft.id) }
        })
      }
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
  <div
    class="flex flex-col gap-6"
    data-testid="deployment-v6-versions-tab"
  >
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
      resource-type="deployment"
      :paginator-rows="20"
      search-placeholder="Search versions"
      :empty-state="{
        title: 'This deployment has no versions yet',
        description:
          'Versions appear here as you save and build configuration changes for this deployment.'
      }"
      :error-state="{
        title: 'Failed to load versions',
        description: 'Something went wrong loading this deployment’s versions. Try again.',
        buttonLabel: 'Retry',
        buttonAction: () => versionsQuery.refetch?.()
      }"
      filtered-empty-title="No versions match your filters"
      filtered-empty-description="Try a different search term or status filter."
      data-testid="deployment-v6-versions__table"
      @update:search-term="searchTerm = $event"
      @update:filter-values="filterValues = $event"
      @update:sort="sort = $event"
      @refresh="versionsQuery.refetch?.()"
      @row-action="handleRowAction"
    >
      <template #toolbar-actions>
        <PrimeButton
          label="New Version"
          icon="pi pi-plus"
          size="small"
          class="h-[2.5rem]"
          :loading="isCreatingDraft"
          data-testid="deployment-v6-versions__new-draft"
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
