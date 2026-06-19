<script setup>
  /**
   * VersionsTab — the version LISTING body of the Firewall v6 screen.
   *
   * Lists every version of the Firewall with search/filter/sort and per-row
   * actions (Clone / Archive / Delete). Clicking a version opens its FULL editor
   * (VersionEditView). Owns its own versions query (deduped by queryKey).
   */
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'

  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'

  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useVersionRowActions } from '@/composables/versioning/use-version-row-actions'

  defineOptions({ name: 'firewall-v6-versions-tab' })

  const props = defineProps({
    firewallId: {
      type: [String, Number],
      required: true
    }
  })

  const router = useRouter()
  const toast = useToast()

  const firewallId = computed(() => String(props.firewallId))
  const isCreatingDraft = ref(false)

  const versionsQuery = edgeFirewallVersionService.useListVersionsQuery(firewallId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const { items, searchTerm, filterValues, sort, filters, sortOptions } =
    useVersionList(rawVersions)

  const columns = [
    { key: 'version', label: 'Version' },
    { key: 'created', label: 'Created by' }
  ]

  const goToVersion = (versionIdOrObject) => {
    const id = typeof versionIdOrObject === 'string' ? versionIdOrObject : versionIdOrObject?.id
    if (!id) return
    router.push(`/firewalls/edit/${firewallId.value}/versions/${id}`)
  }

  const {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    handleConfirm,
    handleVisibility
  } = useVersionRowActions({
    resourceId: firewallId,
    service: edgeFirewallVersionService,
    onCloned: goToVersion,
    onSuccess: () => versionsQuery.refetch?.()
  })

  const createDraft = async () => {
    if (isCreatingDraft.value) return
    isCreatingDraft.value = true
    try {
      const draft = await edgeFirewallVersionService.createDraft(firewallId.value, {})
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
  <div data-testid="firewall-v6-versions-tab">
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
        title: 'This firewall has no versions yet',
        description:
          'Create the first version to start configuring this firewall with the v6 versioning workflow.',
        buttonLabel: 'New Version',
        buttonAction: createDraft
      }"
      :error-state="{
        title: 'Failed to load versions',
        description: 'Something went wrong loading this firewall’s versions. Try again.',
        buttonLabel: 'Retry',
        buttonAction: () => versionsQuery.refetch?.()
      }"
      filtered-empty-title="No versions match your filters"
      filtered-empty-description="Try a different search term or status filter."
      data-testid="firewall-v6-versions__table"
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
          data-testid="firewall-v6-versions__new-draft"
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
