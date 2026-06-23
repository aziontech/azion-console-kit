<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
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
    />

    <VersionActionDialog
      v-if="dialogConfig"
      v-bind="dialogProps"
      :visible="dialogVisible"
      @confirm="handleConfirm"
      @update:visible="handleVisibility"
    />
  </div>
</template>
