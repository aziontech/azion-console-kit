<script setup>
  /**
   * ResourceVersionField — pairs the source resource (read-only, with icon) with
   * the "Version (Ready)" picker. The picker offers a sentinel "Track latest
   * Ready" option (`LATEST_READY`) above the pinnable Ready versions, each shown
   * with its short_id, relative age, author and a "Current" flag. Generic: all
   * data comes from props; the parent owns selection and validity.
   */
  import { computed } from 'vue'
  import Dropdown from '@aziontech/webkit/dropdown'
  import LabelBlock from '@aziontech/webkit/label'
  import { convertToRelativeTime } from '@/helpers/convert-date'
  import { LATEST_READY } from '@/composables/deploy/use-deploy-drawer'

  defineOptions({ name: 'deploy-drawer-resource-version-field' })

  const props = defineProps({
    resourceName: {
      type: String,
      default: ''
    },
    showResource: {
      type: Boolean,
      default: true
    },
    versions: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    invalid: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const onChange = (value) => emit('update:modelValue', value)

  // Grouped: the sentinel "Track latest Ready" on top, then a labelled
  // "PIN A READY VERSION" group with the pinnable Ready versions.
  const dropdownOptions = computed(() => [
    { label: '', items: [{ value: LATEST_READY, label: 'Track latest Ready', isLatest: true }] },
    { label: 'PIN A READY VERSION', items: props.versions }
  ])

  const isLatest = computed(() => props.modelValue === LATEST_READY)

  const selectedOption = computed(
    () => props.versions.find((option) => option.value === props.modelValue) ?? null
  )

  const dropdownPt = {
    panel: { class: 'deploy-version-dropdown-panel' }
  }
</script>

<template>
  <div class="flex flex-col gap-[var(--spacing-4)]">
    <div
      v-if="showResource"
      class="flex flex-col gap-[var(--spacing-2)]"
    >
      <LabelBlock
        label="Resource"
        isRequired
      />
      <span
        class="flex items-center gap-[var(--spacing-2)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-3)] py-[var(--spacing-2)] text-body-sm text-[var(--text-color)]"
        data-testid="deploy-drawer__resource-name"
      >
        <i class="pi pi-box text-[var(--text-color-secondary)]" />
        {{ resourceName }}
      </span>
    </div>

    <div class="flex flex-col gap-[var(--spacing-2)]">
      <LabelBlock
        label="Version (Ready)"
        name="deploy-drawer-version-select"
        isRequired
      />
      <Dropdown
        inputId="deploy-drawer-version-select"
        :modelValue="modelValue"
        :options="dropdownOptions"
        optionLabel="label"
        optionValue="value"
        optionGroupLabel="label"
        optionGroupChildren="items"
        placeholder="Select a version"
        appendTo="body"
        :pt="dropdownPt"
        :disabled="disabled"
        :class="['w-full', { 'p-invalid': invalid }]"
        data-testid="deploy-drawer__version-select"
        @update:modelValue="onChange"
      >
        <template #optiongroup="{ option }">
          <span
            v-if="option.label"
            class="text-[11px] uppercase tracking-[0.04em] text-[var(--text-color-secondary)]"
          >
            {{ option.label }}
          </span>
        </template>
        <template #value>
          <span
            v-if="isLatest"
            class="flex items-center gap-[var(--spacing-2)] text-body-sm text-[var(--text-color)]"
          >
            <i class="pi pi-sync text-[var(--text-primary)]" />
            latest Ready
          </span>
          <span
            v-else-if="selectedOption"
            class="font-mono text-body-sm text-[var(--text-color)]"
          >
            {{ selectedOption.label }}
          </span>
          <span
            v-else
            class="text-body-sm text-[var(--text-color-secondary)]"
            >Select a version</span
          >
        </template>
        <template #option="{ option }">
          <div
            v-if="option.isLatest"
            class="flex w-full flex-col gap-[var(--spacing-1)]"
            data-testid="deploy-drawer__version-latest"
          >
            <span
              class="flex w-full items-center gap-[var(--spacing-2)] text-body-sm text-[var(--text-color)]"
            >
              <i class="pi pi-sync text-[var(--text-primary)]" />
              Track latest Ready
              <i
                v-if="isLatest"
                class="pi pi-check ml-auto text-[var(--text-primary)]"
              />
            </span>
            <span class="text-body-xs text-[var(--text-color-secondary)]">
              Always the newest Ready version
            </span>
          </div>
          <div
            v-else
            class="flex w-full items-center gap-[var(--spacing-3)]"
            :data-testid="`deploy-drawer__version-option-${option.value}`"
          >
            <span class="flex min-w-0 flex-col gap-[var(--spacing-1)]">
              <span class="flex items-center gap-[var(--spacing-2)]">
                <span class="font-mono text-body-sm text-[var(--text-color)]">{{
                  option.label
                }}</span>
                <span
                  v-if="option.isCurrent"
                  class="text-body-xs text-[var(--info-contrast)]"
                >
                  Current
                </span>
              </span>
              <span
                v-if="option.createdAt || option.author"
                class="text-body-xs text-[var(--text-color-secondary)]"
              >
                <template v-if="option.createdAt">{{
                  convertToRelativeTime(option.createdAt)
                }}</template>
                <template v-if="option.createdAt && option.author"> · </template>
                <template v-if="option.author">{{ option.author }}</template>
              </span>
            </span>
            <i
              v-if="option.value === modelValue"
              class="pi pi-check ml-auto text-[var(--text-primary)]"
            />
          </div>
        </template>
      </Dropdown>
      <small
        v-if="invalid"
        class="p-error text-body-xs font-normal"
        data-testid="deploy-drawer__version-error"
      >
        Version is required
      </small>
    </div>
  </div>
</template>

<style>
  .deploy-version-dropdown-panel {
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    background: var(--surface-section);
    color: var(--text-color);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--surface-900, #111827) 16%, transparent);
    /* Cap the panel to the drawer content width so it never spills outside the
       drawer. 52rem = max-w-4xl (56rem) − p-8 (2rem ×2); calc covers narrow viewports. */
    max-width: min(52rem, calc(100vw - 4rem));
  }
  /* Keep items at the panel width so long ids/authors truncate instead of widening it. */
  .deploy-version-dropdown-panel .p-dropdown-items-wrapper,
  .deploy-version-dropdown-panel .p-dropdown-items {
    width: 100%;
    max-width: 100%;
  }
  .deploy-version-dropdown-panel .p-dropdown-items {
    padding: 0.5rem;
  }
  .deploy-version-dropdown-panel .p-dropdown-item {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    align-items: flex-start !important;
    height: auto !important;
    min-height: 3rem !important;
    border-radius: 0.5rem;
    padding: 0.75rem 0.875rem;
    margin-bottom: 0.25rem;
    color: var(--text-color);
    line-height: 1.5rem;
  }
  .deploy-version-dropdown-panel .p-dropdown-item > * {
    min-width: 0;
    max-width: 100%;
  }
  .deploy-version-dropdown-panel .p-dropdown-item:last-child {
    margin-bottom: 0;
  }
  .deploy-version-dropdown-panel .p-dropdown-item:hover {
    background: var(--surface-hover);
    color: var(--text-color);
  }
  .deploy-version-dropdown-panel .p-dropdown-item.p-highlight {
    background: var(--surface-hover);
    color: var(--text-color);
    font-weight: 500;
  }
  .deploy-version-dropdown-panel .p-dropdown-item-group {
    padding: 0.75rem 0.875rem 0.375rem;
    background: transparent;
  }
  .deploy-version-dropdown-panel li.p-dropdown-item-group:first-child {
    display: none;
  }
</style>
