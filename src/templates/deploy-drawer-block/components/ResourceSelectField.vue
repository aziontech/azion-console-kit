<script setup>
  /**
   * ResourceSelectField — generic presentational dropdown for picking a
   * resource from a catalog. No fetching/derivation: the parent feeds
   * `options` (`{ label, value }`) and reacts to selection.
   */
  import { computed } from 'vue'
  import Dropdown from '@aziontech/webkit/dropdown'
  import LabelBlock from '@aziontech/webkit/label'

  defineOptions({ name: 'deploy-drawer-resource-select-field' })

  const props = defineProps({
    modelValue: {
      type: [String, Number],
      default: null
    },
    options: {
      type: Array,
      default: () => []
    },
    label: {
      type: String,
      default: 'Resource'
    },
    placeholder: {
      type: String,
      default: 'Select a resource'
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: true
    },
    clearable: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const onChange = (value) => emit('update:modelValue', value)

  const selectedOption = computed(
    () => props.options.find((option) => option.value === props.modelValue) ?? null
  )

  const filterPlaceholder = computed(() => `Search ${props.options.length} options`)

  const dropdownPt = {
    panel: { class: 'deploy-resource-dropdown-panel' }
  }
</script>

<template>
  <div class="flex flex-col gap-[var(--spacing-2)]">
    <LabelBlock
      :label="label"
      name="deploy-drawer-resource-select"
      :isRequired="required"
    />
    <Dropdown
      inputId="deploy-drawer-resource-select"
      :modelValue="modelValue"
      :options="options"
      optionLabel="label"
      optionValue="value"
      :placeholder="placeholder"
      filter
      appendTo="body"
      :pt="dropdownPt"
      :filterPlaceholder="filterPlaceholder"
      :loading="loading"
      :disabled="disabled"
      :showClear="clearable"
      class="w-full"
      data-testid="deploy-drawer__resource-select"
      @update:modelValue="onChange"
    >
      <template #value>
        <span
          v-if="selectedOption"
          class="flex items-center gap-[var(--spacing-2)]"
        >
          <i class="pi pi-box text-[var(--text-color-secondary)]" />
          <span class="text-body-sm text-[var(--text-color)]">{{ selectedOption.label }}</span>
        </span>
        <span
          v-else
          class="text-body-sm text-[var(--text-color-secondary)]"
          >{{ placeholder }}</span
        >
      </template>
      <template #option="{ option }">
        <span class="flex w-full min-w-0 items-center gap-[var(--spacing-3)] overflow-hidden">
          <i class="pi pi-box shrink-0 text-[var(--text-color-secondary)]" />
          <span class="min-w-0 flex-1 truncate text-body-sm font-medium text-[var(--text-color)]">
            {{ option.label }}
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
  /* Cap the panel to the drawer content width so it never spills outside the
     drawer. 52rem = max-w-4xl (56rem) − p-8 (2rem ×2); calc covers narrow viewports. */
  .deploy-resource-dropdown-panel {
    max-width: min(52rem, calc(100vw - 4rem));
  }
  /* Keep items at the panel width so long names truncate instead of widening it. */
  .deploy-resource-dropdown-panel .p-dropdown-items-wrapper,
  .deploy-resource-dropdown-panel .p-dropdown-items {
    width: 100%;
    max-width: 100%;
  }
  .deploy-resource-dropdown-panel .p-dropdown-item {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }
  .deploy-resource-dropdown-panel .p-dropdown-item > * {
    min-width: 0;
    max-width: 100%;
  }
</style>
