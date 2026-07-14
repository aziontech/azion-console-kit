<script setup>
  /**
   * ResourceOverviewBlock — shared Overview tab body for versionable resources.
   * Renders (top-down): Metrics placeholder (out-of-scope this delivery), Live
   * Deployments table (versions currently receiving traffic) and Version History
   * (remaining versions with search/filter/paginate).
   *
   * Plug-and-play: reads getOverviewConfig(resourceType) for the workload
   * resolver; every version-list plumbing (activeVersions, useVersionList, row
   * menu actions) is reused from the shared versioning composables.
   *
   * Both tables render through the same VersionListDataView so the visual shell
   * (header, borders, row rhythm) matches — Live Deployments hides the toolbar
   * and row menu since it's a small, non-searchable list.
   */
  import { computed, inject, toRef } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeTag from '@aziontech/webkit/prime-tag'

  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useLiveDeployments } from '@/composables/versioning/use-live-deployments'
  import { useWorkloadDirectory } from '@/composables/versioning/use-workload-directory'
  import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'
  import {
    getVersionListColumns,
    getLiveDeploymentColumns
  } from '@/composables/versioning/version-list-columns'
  import { getOverviewConfig } from '@/composables/versioning/overview-resource-config'
  import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

  defineOptions({ name: 'resource-overview-block' })

  const props = defineProps({
    resourceType: { type: String, required: true },
    resourceId: { type: [String, Number], required: true },
    rawVersions: { type: Array, default: () => [] },
    activeVersions: { type: Map, default: () => new Map() },
    activeVersionsLoading: { type: Boolean, default: false },
    versionsQuery: { type: Object, default: null },
    testidPrefix: { type: String, default: 'resource-overview' }
  })

  const router = useRouter()
  const menuHost = inject('versionMenuHost', {})

  const config = computed(() => getOverviewConfig(props.resourceType))

  // Row-menu driver shared with the Versions tab: OPEN_CONFIGURATION on row-click
  // navigates to the version editor; kebab actions (Archive, Delete, Promote…)
  // open the confirmation dialog rendered below.
  const {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    handleConfirm,
    handleVisibility
  } = useVersionMenuActions({
    resourceType: toRef(props, 'resourceType'),
    resourceId: toRef(props, 'resourceId'),
    versionService: menuHost.versionService,
    router,
    openPromoteDrawer: menuHost.openPromoteDrawer,
    onSuccess: menuHost.onSuccess
  })

  // Live Deployments rows carry a composite `id` (versionId::deploymentId) so
  // DataView's dataKey stays unique when a version fans out to N deployments.
  // Before handing the payload to the shared driver, restore the true version id.
  const handleLiveRowAction = ({ action, item }) => {
    handleRowAction({ action, item: { ...item, id: item?.versionId ?? item?.id } })
  }

  // Tenant-wide deployment_id → workload_name directory, fetched once and
  // shared across every Live Deployments row. Falls back to an empty Map on
  // error — the resolver renders "—" in that case.
  const { deploymentToWorkload, isLoading: workloadDirectoryLoading } = useWorkloadDirectory()

  const { liveDeployments } = useLiveDeployments({
    activeVersions: () => props.activeVersions,
    versions: () => props.rawVersions,
    workloadResolver: computed(() => config.value?.workloadResolver),
    resolverContext: computed(() => ({
      resourceId: props.resourceId,
      deploymentToWorkload: deploymentToWorkload.value
    }))
  })

  const liveColumns = getLiveDeploymentColumns()

  // One row per version — Environment and Workload columns render every
  // deployment the version is currently pinned to (see #cell-environment /
  // #cell-workload slots below). Deployed shows the most recent timestamp.
  const liveItems = computed(() =>
    liveDeployments.value.map((row) => ({
      ...row.version,
      id: row.versionId,
      versionId: row.versionId,
      environments: row.environments,
      workloads: row.workloads,
      deployedAt: row.latestDeployedAt,
      deployed: row.latestDeployedAt ? formatDateToDayMonthYearHour(row.latestDeployedAt) : '—'
    }))
  )

  // Version History = raw versions minus those with active traffic. useVersionList
  // owns search/filter/sort/paginator state; feed it the filtered set.
  const historyVersions = computed(() => {
    const active = props.activeVersions
    return props.rawVersions.filter((version) => !active.has(String(version?.id)))
  })

  const { items, searchTerm, filterValues, sort, filters, sortOptions } = useVersionList(
    historyVersions,
    { activeVersions: computed(() => new Map()) }
  )

  const historyColumns = getVersionListColumns({ includeTraffic: false })

  // Both tables show the skeleton until BOTH the version list AND the active-
  // versions query have settled — otherwise, whichever finishes first would
  // flash an empty state before its counterpart's rows arrive.
  const isLoading = computed(
    () =>
      Boolean(props.versionsQuery?.isLoading?.value) ||
      props.activeVersionsLoading ||
      workloadDirectoryLoading.value
  )
  const isError = computed(() => Boolean(props.versionsQuery?.isError?.value))
</script>

<template>
  <div
    class="flex flex-col gap-[var(--spacing-6)]"
    :data-testid="testidPrefix"
  >
    <!--
      Metrics section (Requests / Errors / CPU Time per Figma node 1300-39067)
      is out of scope this delivery and will be inserted above Live Deployments
      in a follow-up.
    -->

    <!-- Live Deployments -->
    <section
      class="flex flex-col gap-[var(--spacing-3)]"
      :data-testid="`${testidPrefix}__live`"
    >
      <header class="flex items-baseline gap-[var(--spacing-2)]">
        <h3 class="m-[0] text-body-md font-semibold text-[var(--text-color)]">Live Deployments</h3>
        <span class="text-body-sm text-[var(--text-color-secondary)]">
          Versions currently receiving traffic.
        </span>
      </header>

      <VersionListDataView
        :items="liveItems"
        :columns="liveColumns"
        :loading="isLoading"
        :is-error="isError"
        :has-versions="liveDeployments.length > 0"
        :show-row-actions="false"
        :show-toolbar="false"
        :resource-type="resourceType"
        :show-paginator="false"
        :empty-state="{
          title: 'No versions currently receiving traffic',
          description:
            'When a version is promoted to a workload, it will appear here as a live deployment.'
        }"
        :data-testid="`${testidPrefix}__live__table`"
        @row-action="handleLiveRowAction"
      >
        <template #cell-version="{ item, onPrimaryClick }">
          <button
            type="button"
            class="version-cell-button flex max-w-full min-w-0 items-center gap-[var(--spacing-2)] border-0 bg-transparent text-left text-[var(--text-color)]"
            :data-testid="`${testidPrefix}__live__row-${item.versionId}__primary`"
            @click="onPrimaryClick"
          >
            <span class="version-hash text-body-sm">{{ item.versionId }}</span>
            <PrimeTag
              severity="success"
              icon="pi pi-globe"
              value="Live"
            />
          </button>
        </template>

        <template #cell-environment="{ item }">
          <span
            v-if="item.environments?.length"
            class="inline-flex flex-wrap items-center gap-[var(--spacing-1)]"
          >
            <PrimeTag
              v-for="name in item.environments"
              :key="name"
              severity="info"
              :value="name"
            />
          </span>
          <span
            v-else
            class="cell-default"
            >—</span
          >
        </template>

        <template #cell-workload="{ item }">
          <span
            v-if="item.workloads?.length"
            class="inline-flex flex-wrap items-center gap-[var(--spacing-1)]"
          >
            <PrimeTag
              v-for="name in item.workloads"
              :key="name"
              severity="info"
              :value="name"
            />
          </span>
          <span
            v-else
            class="cell-default"
            >—</span
          >
        </template>
      </VersionListDataView>
    </section>

    <!-- Version History -->
    <section
      class="flex flex-col gap-[var(--spacing-3)]"
      :data-testid="`${testidPrefix}__history`"
    >
      <header class="flex items-baseline gap-[var(--spacing-2)]">
        <h3 class="m-[0] text-body-md font-semibold text-[var(--text-color)]">Version History</h3>
        <span class="text-body-sm text-[var(--text-color-secondary)]">
          Every other version of this resource.
        </span>
      </header>

      <VersionListDataView
        :items="items"
        :columns="historyColumns"
        :loading="isLoading"
        :is-error="isError"
        :has-versions="historyVersions.length > 0"
        :search-term="searchTerm"
        :filters="filters"
        :filter-values="filterValues"
        :sort="sort"
        :sort-options="sortOptions"
        :show-row-actions="true"
        :resource-type="resourceType"
        :paginator-rows="20"
        search-placeholder="Search versions"
        :empty-state="{
          title: 'No versions in history yet',
          description: 'Versions that are not currently receiving traffic will show up here.'
        }"
        filtered-empty-title="No versions match your filters"
        filtered-empty-description="Try a different search term or status filter."
        :data-testid="`${testidPrefix}__history__table`"
        @update:search-term="searchTerm = $event"
        @update:filter-values="filterValues = $event"
        @update:sort="sort = $event"
        @refresh="versionsQuery?.refetch?.()"
        @row-action="handleRowAction"
      />
    </section>

    <VersionActionDialog
      v-if="dialogConfig"
      v-bind="dialogProps"
      :visible="dialogVisible"
      @confirm="handleConfirm"
      @update:visible="handleVisibility"
    />
  </div>
</template>
