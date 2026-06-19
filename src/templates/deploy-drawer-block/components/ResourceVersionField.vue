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
  import InlineTag from '@/components/InlineTag'
  import { convertToRelativeTime } from '@/helpers/convert-date'
  import { LATEST_READY } from '@/composables/deploy/use-deploy-drawer'

  defineOptions({ name: 'deploy-drawer-resource-version-field' })

  const props = defineProps({
    resourceName: {
      type: String,
      default: ''
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
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <LabelBlock
        label="Resource"
        isRequired
      />
      <span
        class="flex items-center gap-2 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-3 py-2 text-sm text-[var(--text-color)]"
        data-testid="deploy-drawer__resource-name"
      >
        <i class="pi pi-box text-[var(--text-color-secondary)]" />
        {{ resourceName }}
      </span>
    </div>

    <div class="flex flex-col gap-2">
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
            class="flex items-center gap-2 text-sm text-[var(--text-color)]"
          >
            <i class="pi pi-sync text-[var(--text-primary)]" />
            latest Ready
          </span>
          <span
            v-else-if="selectedOption"
            class="font-mono text-sm text-[var(--text-color)]"
          >
            {{ selectedOption.label }}
          </span>
          <span
            v-else
            class="text-sm text-[var(--text-color-secondary)]"
            >Select a version</span
          >
        </template>
        <template #option="{ option }">
          <div
            v-if="option.isLatest"
            class="flex w-full flex-col gap-1"
            data-testid="deploy-drawer__version-latest"
          >
            <span class="flex w-full items-center gap-2 text-sm text-[var(--text-color)]">
              <i class="pi pi-sync text-[var(--text-primary)]" />
              Track latest Ready
              <i
                v-if="isLatest"
                class="pi pi-check ml-auto text-[var(--text-primary)]"
              />
            </span>
            <span class="text-xs text-[var(--text-color-secondary)] leading-tight">
              Always the newest Ready version
            </span>
          </div>
          <div
            v-else
            class="flex w-full items-center gap-3"
            :data-testid="`deploy-drawer__version-option-${option.value}`"
          >
            <InlineTag
              text="Ready"
              type="success"
              icon="pi pi-circle-fill"
            />
            <span class="flex min-w-0 flex-col gap-1">
              <span class="flex items-center gap-2">
                <span class="font-mono text-sm text-[var(--text-color)]">{{ option.label }}</span>
                <span
                  v-if="option.isCurrent"
                  class="text-xs text-[var(--info-contrast,#66adff)]"
                >
                  Current
                </span>
              </span>
              <span
                v-if="option.createdAt || option.author"
                class="text-xs text-[var(--text-color-secondary)] leading-tight"
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
        class="p-error text-xs font-normal leading-tight"
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
  }
  .deploy-version-dropdown-panel .p-dropdown-items {
    padding: 0.5rem;
  }
  .deploy-version-dropdown-panel .p-dropdown-item {
    align-items: flex-start;
    border-radius: 0.5rem;
    padding: 0.625rem 0.875rem;
    margin-bottom: 0.125rem;
    color: var(--text-color);
    line-height: 1.5rem;
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
