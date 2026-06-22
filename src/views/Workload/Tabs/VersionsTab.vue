<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import Menu from '@aziontech/webkit/menu'
  import PrimeButton from '@aziontech/webkit/button'
  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'
  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'
  import { workloadVersionService } from '@/services/v2/workload/workload-version-service'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useWorkloadVersionEnvironments } from '@/composables/versioning/use-workload-version-environments'
  import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'
  import { mapVersionMenuItemsToMenu } from '@/composables/versioning/version-actions'
  import '@/assets/styles/version-row-menu.css'

  defineOptions({ name: 'workload-v6-versions-tab' })

  const props = defineProps({
    workloadId: {
      type: [String, Number],
      required: true
    }
  })

  const router = useRouter()
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
    { key: 'version', label: 'Version', size: 'minmax(220px, 1.4fr)' },
    { key: 'status', label: 'Status', size: 'minmax(140px, 0.8fr)' },
    { key: 'created', label: 'Created by', size: 'minmax(180px, 1.2fr)' }
  ]

  // Single shared driver: every workload version surface (the list AND the
  // current-by-environment band) routes row-action through the same composable
  // and renders the same model, so the menu can never diverge (Req 1.4, 3.3).
  const {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    handleConfirm,
    handleVisibility
  } = useVersionMenuActions({
    resourceType: 'workload',
    resourceId: workloadId,
    versionService: workloadVersionService,
    router,
    workloadId,
    onSuccess: () => versionsQuery.refetch?.()
  })

  // The band has no per-row emitter, so it renders the shared model into a popup
  // Menu and forwards the command to the same handler used by the list.
  const bandMenuRef = ref(null)
  const bandMenuModel = ref([])

  const openBandMenu = (event, version) => {
    event?.stopPropagation?.()
    bandMenuModel.value = mapVersionMenuItemsToMenu(
      version.state,
      { resourceType: 'workload' },
      handleRowAction,
      version
    )
    bandMenuRef.value?.toggle?.(event)
  }
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
          <div class="flex items-start justify-between gap-2">
            <span
              class="text-[0.625rem] font-medium uppercase leading-4 tracking-[0.0625rem] text-[var(--text-color-secondary)]"
            >
              Environment
            </span>
            <PrimeButton
              icon="pi pi-ellipsis-v"
              text
              severity="secondary"
              class="-mr-1 -mt-1 h-8 w-8 !p-0 text-[var(--text-color-secondary)]"
              aria-label="Version actions"
              :data-testid="`workload-v6-versions__environment-menu-${environment.environmentId}`"
              @click="openBandMenu($event, environment.version)"
            />
          </div>
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
      :show-row-actions="true"
      resource-type="workload"
      :paginator-rows="20"
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
      @row-action="handleRowAction"
    />

    <Menu
      ref="bandMenuRef"
      :popup="true"
      :model="bandMenuModel"
      appendTo="body"
      class="version-row-menu"
    >
      <template #item="{ item, props: itemProps }">
        <a
          v-tooltip.left="item.tooltip ? { value: item.tooltip, showDelay: 200 } : undefined"
          class="version-row-menu__item"
          :class="{ 'version-row-menu__item--danger': item.class === 'danger' }"
          v-bind="itemProps.action"
        >
          <span
            v-if="item.icon"
            class="version-row-menu__icon"
            :class="item.icon"
            aria-hidden="true"
          />
          <span class="version-row-menu__label">{{ item.label }}</span>
        </a>
      </template>
    </Menu>

    <VersionActionDialog
      v-if="dialogConfig"
      v-bind="dialogProps"
      :visible="dialogVisible"
      @confirm="handleConfirm"
      @update:visible="handleVisibility"
    />
  </div>
</template>
