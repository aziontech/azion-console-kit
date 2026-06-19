<script setup>
  import { computed } from 'vue'
  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'
  import VersionListDataView from '@/components/VersionListDataView'
  import { workloadVersionService } from '@/services/v2/workload/workload-version-service'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useWorkloadVersionEnvironments } from '@/composables/versioning/use-workload-version-environments'

  defineOptions({ name: 'workload-v6-versions-tab' })

  const props = defineProps({
    workloadId: {
      type: [String, Number],
      required: true
    }
  })

  const workloadId = computed(() => String(props.workloadId))

  const versionsQuery = workloadVersionService.useListVersionsQuery(workloadId)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const { items, searchTerm, filterValues, sort, filters, sortOptions } = useVersionList(
    rawVersions,
    { searchableFields: ['id', 'state', 'comment'] }
  )

  const { environments } = useWorkloadVersionEnvironments(workloadId, rawVersions, {
    service: workloadVersionService
  })

  const columns = [
    { key: 'version', label: 'Version' },
    { key: 'created', label: 'Created by' }
  ]
</script>

<template>
  <div
    class="flex flex-col gap-6"
    data-testid="workload-v6-versions-tab"
  >
    <section
      v-if="environments.length"
      class="flex flex-col gap-3"
      data-testid="workload-v6-versions__current-by-environment"
    >
      <header class="flex flex-col gap-1">
        <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
          Current by environment
        </h3>
        <p class="m-0 text-sm leading-5 text-[var(--text-color-secondary)]">
          The version currently serving traffic in each environment bound to this Workload.
        </p>
      </header>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="environment in environments"
          :key="environment.environmentId"
          class="flex flex-col gap-2 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] p-4"
          data-testid="workload-v6-versions__environment-card"
        >
          <span
            class="text-[0.625rem] font-medium uppercase leading-4 tracking-[0.0625rem] text-[var(--text-color-secondary)]"
          >
            Environment
          </span>
          <span
            class="font-mono text-sm font-semibold leading-5 text-[var(--text-color)]"
            :title="environment.environmentId"
          >
            {{ environment.environmentId }}
          </span>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <span
              class="font-mono text-sm leading-5 text-[var(--text-color)]"
              :title="environment.version.id"
            >
              {{ environment.version.id }}
            </span>
            <VersionStateBadge :state="environment.version.state" />
          </div>
        </article>
      </div>
    </section>

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
      :show-row-actions="false"
      :paginator-rows="10"
      search-placeholder="Search versions"
      :empty-state="{
        title: 'This workload has no versions yet',
        description:
          'Versions appear here as you save and build configuration changes for this Workload.'
      }"
      :error-state="{
        title: 'Failed to load versions',
        description: 'Something went wrong loading this Workload’s versions. Try again.',
        buttonLabel: 'Retry',
        buttonAction: () => versionsQuery.refetch?.()
      }"
      filtered-empty-title="No versions match your filters"
      filtered-empty-description="Try a different search term or status filter."
      data-testid="workload-v6-versions__table"
      @update:search-term="searchTerm = $event"
      @update:filter-values="filterValues = $event"
      @update:sort="sort = $event"
      @refresh="versionsQuery.refetch?.()"
    />
  </div>
</template>
