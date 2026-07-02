<script setup>
  /**
   * DeploymentSettingsPicker — presentational multi-select list of Deployment
   * Settings (the atomic deploy unit) with search and a selected counter. It
   * does not fetch, filter, derive or resolve anything: `deployments` arrive
   * already enriched from the composable, `query` is owned by the parent, and
   * selection is a plain array of ids surfaced through `modelValue`.
   *
   * A Deployment Setting row never fabricates data: it renders only the icon,
   * `name`, the `policyLabel` tag and, when present, the impact metadata
   * (`workloadsCount`, `environmentNames`) that already arrives on each object.
   *
   * @prop {Array<{ id, name, policyLabel, workloadsCount?, environmentNames? }>} deployments
   *   Flat list of Deployment Settings. Used as a fallback when `groups` is empty.
   *   `workloadsCount` (number) renders a "{N} Workloads affected" line and is
   *   omitted when absent (never fabricated to 0). `environmentNames` (string[])
   *   renders up to three tags plus a "+K" overflow chip.
   * @prop {Array<{ key: 'linked'|'available', label: string, deployments: Array<{ id, name, policyLabel, workloadsCount?, environmentNames? }> }>} groups
   *   Sectioned Deployment Settings. When populated, rows render grouped under
   *   `label` headers (empty groups omitted) and the listed set — driving the
   *   counter, select-all/clear-all and search — is the union of all groups.
   * @prop {Array<string|number>} modelValue Selected Deployment Setting ids.
   * @prop {string} query Search string (owned by the parent).
   * @prop {boolean} isLoadingMeta When true, the impact metadata (workloads
   *   count and environment tags) is replaced by a discrete skeleton placeholder.
   *
   * @emits update:modelValue When the selection changes.
   * @emits update:query When the search string changes.
   * @emits bind-environment When the empty-state action is triggered.
   */
  import { computed } from 'vue'
  import Checkbox from '@aziontech/webkit/checkbox'
  import InputText from '@aziontech/webkit/inputtext'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'release-deployment-settings-picker' })

  const props = defineProps({
    deployments: {
      type: Array,
      default: () => []
    },
    groups: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: Array,
      default: () => []
    },
    query: {
      type: String,
      default: ''
    },
    isLoadingMeta: {
      type: Boolean,
      default: false
    }
  })

  const MAX_ENV_TAGS = 3

  const visibleEnvNames = (ds) => (ds.environmentNames ?? []).slice(0, MAX_ENV_TAGS)
  const remainingEnvNames = (ds) => (ds.environmentNames ?? []).slice(MAX_ENV_TAGS)
  const extraEnvCount = (ds) => remainingEnvNames(ds).length
  const hasWorkloadsCount = (ds) => Number.isFinite(ds.workloadsCount)

  const emit = defineEmits(['update:modelValue', 'update:query', 'bind-environment'])

  const selectedIds = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // Selection is driven by the ROW click (single source of truth) and the visual
  // Checkbox is a controlled, non-interactive reflection of `modelValue`. This
  // avoids the double-toggle a label-wrapped self-toggling Checkbox produced — a
  // click on the box fired PrimeVue's own toggle AND the wrapping <label>
  // forwarded a second toggle to the native input, netting to no change (the
  // reported "first click does nothing", with the box left visually checked but
  // the model — and so the counter/impact — never updated).
  const toggle = (id) => {
    const isSelected = props.modelValue.some((item) => String(item) === String(id))
    selectedIds.value = isSelected
      ? props.modelValue.filter((item) => String(item) !== String(id))
      : [...props.modelValue, id]
  }

  const searchTerm = computed({
    get: () => props.query,
    set: (value) => emit('update:query', value)
  })

  // When `groups` is populated the picker renders sectioned rows; the flat
  // "listed" set is the union of every group's deployments in group order.
  // With no groups it falls back to the plain `deployments` prop.
  const visibleGroups = computed(() =>
    props.groups.filter((group) => group.deployments && group.deployments.length > 0)
  )

  const hasGroups = computed(() => visibleGroups.value.length > 0)

  const listedDeployments = computed(() =>
    hasGroups.value ? visibleGroups.value.flatMap((group) => group.deployments) : props.deployments
  )

  const total = computed(() => listedDeployments.value.length)
  const selectedCount = computed(() => props.modelValue.length)

  const searchPlaceholder = computed(() => `Search ${total.value} Deployment Settings`)

  const hasDeployments = computed(() => total.value > 0)

  // Normalized render model: grouped mode yields one section per non-empty
  // group (with a header), flat mode yields a single header-less section.
  const sections = computed(() =>
    hasGroups.value
      ? visibleGroups.value.map((group) => ({
          key: group.key,
          label: group.label,
          deployments: group.deployments
        }))
      : [{ key: null, label: null, deployments: props.deployments }]
  )

  // Select-all / clear-all over the LISTED candidate set (req 1.9 / NRS §4.5).
  // `deployments` may be a filtered/capped view (search term, display cap), so
  // these operate ONLY on the currently LISTED rows and never disturb selections
  // hidden by the search. They emit through the array contract
  // (`update:modelValue`) exactly like a row toggle, so the parent's selection
  // wiring stays single-sourced.
  const isSelected = (id) => props.modelValue.some((item) => String(item) === String(id))

  // `allSelected` reflects whether every LISTED row is already in the selection
  // (so it disables select-all once the visible set is fully picked), regardless
  // of selections hidden by the current search.
  const allSelected = computed(
    () =>
      hasDeployments.value &&
      listedDeployments.value.every((deployment) => isSelected(deployment.id))
  )

  // Select-all UNIONS the listed ids with the existing selection so rows hidden
  // by the search/cap stay selected (never dropped).
  const selectAll = () => {
    const listedToAdd = listedDeployments.value
      .map((deployment) => deployment.id)
      .filter((id) => !isSelected(id))
    selectedIds.value = [...props.modelValue, ...listedToAdd]
  }

  // Clear-all removes ONLY the listed rows from the selection, preserving any
  // selections hidden by the search/cap.
  const clearAll = () => {
    const listedIds = new Set(listedDeployments.value.map((deployment) => String(deployment.id)))
    selectedIds.value = props.modelValue.filter((item) => !listedIds.has(String(item)))
  }
</script>

<template>
  <div
    class="flex flex-col gap-[var(--spacing-3)]"
    data-testid="release-composition__ds-picker"
  >
    <div
      class="flex flex-col gap-[var(--spacing-1)]"
      data-testid="release-composition__ds-label"
    >
      <label
        class="flex items-center gap-[var(--spacing-1)] text-body-sm font-semibold text-[var(--text-color-secondary)]"
      >
        Deployment Settings
        <span
          class="text-[var(--color-orange-500)]"
          aria-hidden="true"
          >*</span
        >
      </label>
      <span
        class="text-body-xs text-[var(--text-color-secondary)]"
        data-testid="release-composition__ds-helper"
      >
        Pick the Deployment Settings to publish into. A DS is the atomic unit — selecting it affects
        <strong class="font-bold text-[var(--text-color)]">all</strong> Environments &amp; Workloads
        bound to it (shown on the right).
      </span>
    </div>

    <div
      v-if="hasDeployments"
      class="flex flex-wrap items-center gap-[var(--spacing-3)]"
    >
      <span class="p-input-icon-left flex-1 min-w-[var(--container-3xs)]">
        <i class="pi pi-search text-[var(--text-color-secondary)]" />
        <InputText
          v-model="searchTerm"
          :placeholder="searchPlaceholder"
          class="w-full"
          data-testid="release-composition__ds-search"
        />
      </span>
      <span
        class="text-body-xs text-[var(--text-color-secondary)]"
        data-testid="release-composition__ds-selected-counter"
      >
        {{ selectedCount }} selected
      </span>
      <span class="flex items-center gap-[var(--spacing-2)]">
        <PrimeButton
          label="Select all"
          link
          size="small"
          :disabled="allSelected"
          data-testid="release-composition__ds-select-all"
          @click="selectAll"
        />
        <PrimeButton
          label="Clear all"
          link
          size="small"
          :disabled="selectedCount === 0"
          data-testid="release-composition__ds-clear-all"
          @click="clearAll"
        />
      </span>
    </div>

    <div
      v-if="hasDeployments"
      class="flex flex-col gap-[var(--spacing-3)] overflow-y-auto max-h-[var(--container-xs)] pr-[var(--spacing-1)]"
      data-testid="release-composition__ds-list"
    >
      <template
        v-for="section in sections"
        :key="section.key ?? '__flat'"
      >
        <span
          v-if="section.label"
          class="text-body-xs font-semibold text-[var(--text-color-secondary)]"
          :data-testid="`release-composition__ds-group-${section.key}`"
        >
          {{ section.label }}
        </span>
        <div
          v-for="ds in section.deployments"
          :key="ds.id"
          role="checkbox"
          :aria-checked="selectedIds.includes(ds.id)"
          :aria-label="ds.name"
          tabindex="0"
          class="flex cursor-pointer items-start gap-[var(--spacing-3)] rounded-[var(--shape-card)] border px-[var(--spacing-4)] py-[var(--spacing-4)] transition-colors"
          :class="
            selectedIds.includes(ds.id)
              ? 'border-[var(--border-selected)] bg-[var(--surface-50)]'
              : 'border-[var(--surface-border)]'
          "
          :data-testid="`release-composition__ds-row-${ds.id}`"
          @click="toggle(ds.id)"
          @keydown.enter.prevent="toggle(ds.id)"
          @keydown.space.prevent="toggle(ds.id)"
        >
          <Checkbox
            :modelValue="selectedIds.includes(ds.id)"
            binary
            tabindex="-1"
            class="pointer-events-none"
            :inputId="`release-composition__ds-checkbox-${ds.id}`"
            :data-testid="`release-composition__ds-checkbox-${ds.id}`"
          />
          <div class="flex flex-1 flex-col gap-[var(--spacing-1)]">
            <span class="flex flex-wrap items-center gap-[var(--spacing-2)]">
              <i class="pi pi-send text-[var(--text-color-secondary)]" />
              <span class="text-body-sm text-[var(--text-color)]">{{ ds.name }}</span>

              <span
                v-if="!isLoadingMeta && visibleEnvNames(ds).length"
                class="flex flex-wrap items-center gap-[var(--spacing-1)]"
                :data-testid="`release-composition__ds-envs-${ds.id}`"
              >
                <span
                  v-for="envName in visibleEnvNames(ds)"
                  :key="envName"
                  class="inline-flex items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
                  :data-testid="`release-composition__ds-env-${ds.id}`"
                >
                  {{ envName }}
                </span>
                <span
                  v-if="extraEnvCount(ds) > 0"
                  v-tooltip.top="remainingEnvNames(ds).join(', ')"
                  tabindex="0"
                  role="button"
                  :aria-label="`${extraEnvCount(ds)} more Environments: ${remainingEnvNames(ds).join(', ')}`"
                  class="inline-flex cursor-default items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-selected)]"
                  :data-testid="`release-composition__ds-env-more-${ds.id}`"
                >
                  +{{ extraEnvCount(ds) }}
                </span>
              </span>
            </span>

            <div
              v-if="isLoadingMeta"
              class="flex flex-col gap-[var(--spacing-1)]"
              :data-testid="`release-composition__ds-meta-skeleton-${ds.id}`"
            >
              <span class="flex items-center gap-[var(--spacing-2)]">
                <span
                  class="inline-block h-[var(--spacing-4)] w-[var(--spacing-16)] rounded-[var(--shape-elements)] bg-[var(--surface-200)] animate-pulse"
                />
                <span
                  class="inline-block h-[var(--spacing-4)] w-[var(--spacing-16)] rounded-[var(--shape-elements)] bg-[var(--surface-200)] animate-pulse"
                />
              </span>
              <span
                class="inline-block h-[var(--spacing-3)] w-[var(--spacing-24)] rounded-[var(--shape-elements)] bg-[var(--surface-200)] animate-pulse"
              />
            </div>

            <span
              v-else-if="hasWorkloadsCount(ds)"
              class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
              :data-testid="`release-composition__ds-workloads-${ds.id}`"
            >
              <i class="pi pi-globe" />
              {{ ds.workloadsCount }} Workloads affected
            </span>
          </div>
          <span
            class="inline-flex shrink-0 items-center self-start rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
            :data-testid="`release-composition__ds-policy-${ds.id}`"
          >
            {{ ds.policyLabel }}
          </span>
        </div>
      </template>
    </div>

    <div
      v-else
      class="flex flex-col gap-[var(--spacing-3)]"
      data-testid="release-composition__ds-empty"
    >
      <InlineMessage severity="secondary">No Deployment Settings</InlineMessage>
      <PrimeButton
        label="Bind Environment"
        icon="pi pi-external-link"
        iconPos="right"
        size="small"
        outlined
        class="self-start"
        data-testid="release-composition__ds-bind-environment"
        @click="emit('bind-environment')"
      />
    </div>
  </div>
</template>
