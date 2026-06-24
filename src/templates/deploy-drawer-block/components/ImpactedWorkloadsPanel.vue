<script setup>
  /**
   * ImpactedWorkloadsPanel — read-only impact-radius warning for the
   * deployment-anchored deploy flow. Fixed-footprint, 3-layer progressive
   * disclosure: constant-height summary → collapsible scrollable list grouped by
   * environment → search + environment filter for large lists. Dumb/presentational:
   * `workloads` arrive already derived (`{ id, name, environments: [name] }`).
   */
  import { computed, ref, watch } from 'vue'
  import LabelBlock from '@aziontech/webkit/label'
  import InputText from '@aziontech/webkit/inputtext'
  import SelectButton from '@aziontech/webkit/selectbutton'
  import MessageCard from '@/components/MessageCard'

  defineOptions({ name: 'deploy-drawer-impacted-workloads-panel' })

  const props = defineProps({
    deploymentName: {
      type: String,
      default: ''
    },
    workloads: {
      type: Array,
      default: () => []
    },
    count: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    },
    defaultExpanded: {
      type: Boolean,
      default: null
    },
    inlineThreshold: {
      type: Number,
      default: 5
    },
    searchThreshold: {
      type: Number,
      default: 8
    },
    listMaxHeight: {
      type: Number,
      default: 260
    }
  })

  const ALL = 'all'

  const search = ref('')
  const activeEnv = ref(ALL)
  const userToggled = ref(false)

  const resolveExpanded = (count) =>
    props.defaultExpanded === null || props.defaultExpanded === undefined
      ? count <= props.inlineThreshold
      : props.defaultExpanded

  const expanded = ref(resolveExpanded(props.count))

  // Until the user decides, the list auto-follows the threshold as the count
  // resolves (the drawer's queries land after the panel mounts).
  watch(
    () => props.count,
    (count) => {
      if (!userToggled.value) expanded.value = resolveExpanded(count)
    }
  )

  const headline = computed(
    () => `${props.count} ${props.count === 1 ? 'workload' : 'workloads'} will be impacted`
  )

  const rows = computed(() =>
    props.workloads.flatMap((workload) =>
      (workload.environments ?? []).map((environment) => ({
        id: workload.id,
        name: workload.name,
        environment: String(environment)
      }))
    )
  )

  const totalRows = computed(() => rows.value.length)

  const breakdown = computed(() => {
    const counts = new Map()
    rows.value.forEach((row) => {
      counts.set(row.environment, (counts.get(row.environment) ?? 0) + 1)
    })
    return Array.from(counts, ([environment, total]) => ({ environment, total })).sort(
      (first, second) =>
        second.total - first.total || first.environment.localeCompare(second.environment)
    )
  })

  const showSearchAndFilter = computed(() => props.count >= props.searchThreshold)

  const filterOptions = computed(() => [
    { label: 'All', value: ALL },
    ...breakdown.value.map((entry) => ({ label: entry.environment, value: entry.environment }))
  ])

  const filteredRows = computed(() => {
    const term = search.value.trim().toLowerCase()
    return rows.value.filter((row) => {
      const matchesEnv = activeEnv.value === ALL || row.environment === activeEnv.value
      const matchesName =
        !term ||
        String(row.name ?? '')
          .toLowerCase()
          .includes(term)
      return matchesEnv && matchesName
    })
  })

  const filteredCount = computed(() => filteredRows.value.length)

  const filteredGroups = computed(() => {
    const byEnv = new Map()
    filteredRows.value.forEach((row) => {
      if (!byEnv.has(row.environment)) byEnv.set(row.environment, [])
      byEnv.get(row.environment).push(row)
    })
    return breakdown.value
      .filter((entry) => byEnv.has(entry.environment))
      .map((entry) => ({ environment: entry.environment, items: byEnv.get(entry.environment) }))
  })

  const toggle = () => {
    userToggled.value = true
    expanded.value = !expanded.value
  }
</script>

<template>
  <div
    class="flex flex-col gap-3"
    data-testid="deploy-drawer__impacted-workloads"
  >
    <LabelBlock label="Impacted Workloads" />
    <span class="text-xs text-[var(--text-color-secondary)] leading-tight -mt-2">
      This Release runs on Deployment
      <b v-if="deploymentName">{{ deploymentName }}</b>
      and updates every Workload bound to it.
    </span>

    <div
      v-if="loading"
      class="flex items-center gap-2 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-4 py-3"
      data-testid="deploy-drawer__impacted-workloads-loading"
    >
      <i class="pi pi-spin pi-spinner text-[var(--text-color-secondary)]" />
      <span class="text-sm text-[var(--text-color-secondary)]">Resolving impacted Workloads…</span>
    </div>

    <div
      v-else-if="count === 0"
      class="flex items-start gap-3 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-4 py-4"
      data-testid="deploy-drawer__impacted-workloads-empty"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--surface-ground)]"
      >
        <i class="pi pi-globe text-[var(--text-color-secondary)]" />
      </span>
      <div class="flex flex-1 flex-col gap-1">
        <span class="text-sm font-medium text-[var(--text-color)]">No Workloads bound yet</span>
        <span class="text-xs text-[var(--text-color-secondary)] leading-tight">
          This Deployment isn't bound to any Workload yet. The Release is still created and ready to
          serve once a Workload binds to it.
        </span>
      </div>
    </div>

    <template v-else>
      <div class="flex flex-col gap-3">
        <MessageCard
          type="warning"
          :title="headline"
          data-testid="deploy-drawer__impacted-workloads-summary"
        >
          <template #actions>
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs font-medium text-[var(--text-color-secondary)] hover:text-[var(--text-color)] focus-visible:text-[var(--text-color)] focus-visible:outline-none"
              :aria-expanded="expanded"
              aria-controls="impacted-workloads-list"
              data-testid="deploy-drawer__impacted-workloads-toggle"
              @click="toggle"
            >
              <span>{{ expanded ? 'Hide workloads' : 'Show workloads' }}</span>
              <i
                class="pi pi-chevron-down text-xs transition-transform"
                :class="{ 'rotate-180': expanded }"
              />
            </button>
          </template>
        </MessageCard>

        <ul
          class="flex flex-wrap gap-1.5"
          aria-label="Impacted environments"
          data-testid="deploy-drawer__impacted-workloads-pills"
        >
          <li
            v-for="entry in breakdown"
            :key="entry.environment"
            class="inline-flex items-center gap-1 rounded-full border border-[var(--surface-border)] bg-[var(--surface-section)] px-2.5 py-0.5 text-xs text-[var(--text-color-secondary)]"
          >
            <span>{{ entry.environment }}</span>
            <span class="font-medium text-[var(--text-color)]">{{ entry.total }}</span>
          </li>
        </ul>

        <div
          v-if="expanded"
          id="impacted-workloads-list"
          role="region"
          aria-label="Impacted workloads"
          class="flex flex-col overflow-hidden rounded-md border border-[var(--surface-border)]"
        >
          <div
            v-if="showSearchAndFilter"
            class="flex flex-col gap-2 border-b border-[var(--surface-border)] px-3 py-2"
          >
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search text-[var(--text-color-secondary)]" />
              <InputText
                v-model="search"
                placeholder="Search workloads"
                aria-label="Search workloads by name"
                class="w-full"
                data-testid="deploy-drawer__impacted-workloads-search"
              />
            </span>
            <SelectButton
              v-model="activeEnv"
              :options="filterOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
              aria-label="Filter by environment"
              class="impacted-env-filter w-full overflow-x-auto whitespace-nowrap"
              data-testid="deploy-drawer__impacted-workloads-filter"
            />
          </div>

          <div
            v-if="filteredGroups.length"
            class="overflow-y-auto"
            :style="{ maxHeight: `${listMaxHeight}px` }"
          >
            <div
              v-for="group in filteredGroups"
              :key="group.environment"
            >
              <div
                class="sticky top-0 z-10 border-b border-[var(--surface-border)] bg-[var(--surface-section)] px-4 py-1.5 text-xs font-medium uppercase text-[var(--text-color-secondary)]"
              >
                {{ group.environment }} · {{ group.items.length }}
              </div>
              <ul class="flex flex-col">
                <li
                  v-for="(item, index) in group.items"
                  :key="`${item.id}-${index}`"
                  class="flex items-center gap-2 border-b border-[var(--surface-border)] px-4 py-2.5 last:border-b-0"
                  :data-testid="`deploy-drawer__impacted-workload-${item.id}`"
                >
                  <i class="pi pi-globe shrink-0 text-[var(--text-color-secondary)]" />
                  <span class="min-w-0 truncate text-sm text-[var(--text-color)]">
                    {{ item.name }}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div
            v-else
            class="px-4 py-6 text-center text-sm text-[var(--text-color-secondary)]"
            data-testid="deploy-drawer__impacted-workloads-no-match"
          >
            No workloads found
          </div>

          <span
            v-if="showSearchAndFilter"
            class="border-t border-[var(--surface-border)] px-3 py-2 text-xs text-[var(--text-color-secondary)]"
            data-testid="deploy-drawer__impacted-workloads-footer"
          >
            Showing {{ filteredCount }} of {{ totalRows }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
