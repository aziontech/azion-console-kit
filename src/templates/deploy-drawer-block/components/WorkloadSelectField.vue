<script setup>
  /**
   * WorkloadSelectField — presentational wrapper over the Design System Dropdown
   * for picking the target workload. No fetching/derivation: the parent feeds
   * `options` (`{ label, value, domain, environmentCount }`) and reacts to
   * selection. Panel, density, hover, focus ring and a11y come from the DS
   * Dropdown; only the trigger/option content lives here.
   */
  import { computed } from 'vue'
  import Dropdown from '@aziontech/webkit/dropdown'
  import LabelBlock from '@aziontech/webkit/label'

  defineOptions({ name: 'deploy-drawer-workload-select-field' })

  const props = defineProps({
    modelValue: {
      type: [String, Number],
      default: null
    },
    options: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const onChange = (value) => emit('update:modelValue', value)

  const selectedOption = computed(
    () => props.options.find((option) => option.value === props.modelValue) ?? null
  )

  // Conditional singular/plural for any item counter ("1 environment" / "N
  // environments", "Search 1 workload" / "Search N workloads").
  const formatCount = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

  // Second line: joins domain + environment count with " · " only when both are
  // present, so a missing domain never leaves a dangling separator.
  const optionMeta = (option) =>
    [
      option.domain,
      option.environmentCount != null && formatCount(option.environmentCount, 'environment')
    ]
      .filter(Boolean)
      .join(' · ')

  const filterPlaceholder = computed(
    () => `Search ${formatCount(props.options.length, 'workload')}`
  )

  const dropdownPt = {
    panel: { class: 'deploy-workload-dropdown-panel' }
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <LabelBlock
      label="Workload"
      name="deploy-drawer-workload-select"
      isRequired
    />
    <span class="text-xs text-[var(--text-color-secondary)] leading-tight">
      Choose the Workload that will serve this version. The available Environments — and each one's
      Deployment (strategy) — come from it.
    </span>
    <Dropdown
      inputId="deploy-drawer-workload-select"
      :modelValue="modelValue"
      :options="options"
      optionLabel="label"
      optionValue="value"
      placeholder="Select a Workload"
      filter
      filterIcon="pi pi-search"
      appendTo="body"
      :pt="dropdownPt"
      :filterPlaceholder="filterPlaceholder"
      :loading="loading"
      :disabled="disabled"
      class="w-full"
      data-testid="deploy-drawer__workload-select"
      @update:modelValue="onChange"
    >
      <template #value>
        <span
          v-if="selectedOption"
          class="flex items-center gap-2"
        >
          <i class="pi pi-globe text-[var(--text-color-secondary)]" />
          <span class="text-sm font-medium text-[var(--text-color)]">{{
            selectedOption.label
          }}</span>
          <span
            v-if="selectedOption.domain"
            class="text-xs text-[var(--text-color-secondary)]"
          >
            {{ selectedOption.domain }}
          </span>
        </span>
        <span
          v-else
          class="text-sm text-[var(--text-color-secondary)]"
          >Select a Workload</span
        >
      </template>
      <template #option="{ option }">
        <span class="flex w-full min-w-0 items-center gap-3 overflow-hidden">
          <i class="pi pi-globe shrink-0 text-[var(--text-color-secondary)]" />
          <span class="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
            <span class="block truncate text-sm font-medium text-[var(--text-color)]">
              {{ option.label }}
            </span>
            <span class="block truncate text-xs leading-tight text-[var(--text-color-secondary)]">
              {{ optionMeta(option) }}
            </span>
          </span>
          <i
            v-if="option.value === modelValue"
            class="pi pi-check ml-auto shrink-0 text-[var(--text-primary)]"
          />
        </span>
      </template>
    </Dropdown>
  </div>
</template>

<style>
  /* Search field: pi-search on the left (Console input pattern). */
  .deploy-workload-dropdown-panel .p-dropdown-filter-container {
    position: relative;
    width: 100%;
  }
  .deploy-workload-dropdown-panel .p-dropdown-filter {
    width: 100%;
    padding-left: 2.25rem;
  }
  .deploy-workload-dropdown-panel .p-dropdown-filter-icon {
    left: 0.85rem;
    right: auto;
  }
  /* Cap the panel to the drawer content width so it never spills outside the
     drawer. 52rem = max-w-4xl (56rem) − p-8 (2rem ×2); calc covers narrow viewports. */
  .deploy-workload-dropdown-panel {
    max-width: min(52rem, calc(100vw - 4rem));
  }
  /* Keep items at the panel width so long names truncate instead of widening it. */
  .deploy-workload-dropdown-panel .p-dropdown-items-wrapper,
  .deploy-workload-dropdown-panel .p-dropdown-items {
    width: 100%;
    max-width: 100%;
  }
  .deploy-workload-dropdown-panel .p-dropdown-items {
    padding: 0.5rem;
  }
  .deploy-workload-dropdown-panel .p-dropdown-item {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    height: auto !important;
    min-height: 3rem !important;
    border-radius: 0.5rem;
    padding: 0.75rem 0.875rem;
    margin-bottom: 0.25rem;
  }
  .deploy-workload-dropdown-panel .p-dropdown-item:last-child {
    margin-bottom: 0;
  }
  .deploy-workload-dropdown-panel .p-dropdown-item:hover {
    background: var(--surface-hover);
    color: var(--text-color);
  }
  .deploy-workload-dropdown-panel .p-dropdown-item.p-highlight {
    background: var(--surface-hover);
    color: var(--text-color);
    font-weight: 500;
  }
  .deploy-workload-dropdown-panel .p-dropdown-item > * {
    min-width: 0;
    max-width: 100%;
  }
</style>
