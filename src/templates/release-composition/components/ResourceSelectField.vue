<script setup>
  /**
   * ResourceSelectField — generic presentational select for picking a resource
   * from a catalog. Built on the webkit `Dropdown` (`@aziontech/webkit/inputs/dropdown`,
   * a first-class webkit component — NOT the raw PrimeVue wrapper), so it carries
   * the design-system field styling. No fetching/derivation: the parent feeds
   * `options` (`{ label, value }`) and reacts to selection via `update:modelValue`.
   */
  import { computed } from 'vue'
  import Dropdown from '@aziontech/webkit/inputs/dropdown'

  defineOptions({ name: 'release-resource-select-field' })

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

  // Options sorted ascending by label (case-insensitive, natural numeric order) so
  // the resource list is predictable regardless of the catalog's API order.
  const sortedOptions = computed(() =>
    [...props.options].sort((left, right) =>
      String(left?.label ?? '').localeCompare(String(right?.label ?? ''), undefined, {
        sensitivity: 'base',
        numeric: true
      })
    )
  )

  const filterPlaceholder = computed(() => `Search ${props.options.length} options`)
</script>

<template>
  <div class="flex min-w-0 flex-col gap-[var(--spacing-2)]">
    <label
      class="flex items-center gap-[var(--spacing-1)] text-body-sm font-medium text-[var(--text-color-secondary)]"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-[var(--color-orange-500)]"
        aria-hidden="true"
        >*</span
      >
    </label>
    <Dropdown
      :modelValue="modelValue"
      :options="sortedOptions"
      optionLabel="label"
      optionValue="value"
      :placeholder="placeholder"
      :loading="loading"
      :disabled="disabled"
      :showClear="clearable"
      filter
      :filterPlaceholder="filterPlaceholder"
      class="release-composition-control w-full"
      data-testid="release-composition__resource-select"
      @update:modelValue="onChange"
    >
      <template #value>
        <span
          v-if="selectedOption"
          class="block truncate text-body-sm text-[var(--text-color)]"
          >{{ selectedOption.label }}</span
        >
        <span
          v-else
          class="block truncate text-body-sm text-[var(--text-color-secondary)]"
          >{{ placeholder }}</span
        >
      </template>
      <template #option="{ option }">
        <span class="block truncate text-body-sm text-[var(--text-color)]">{{ option.label }}</span>
      </template>
    </Dropdown>
  </div>
</template>

<style scoped>
  /* Tune the webkit Dropdown control to the app's surface tokens (the webkit
     defaults — --bg-surface / --border-default — are a different DS layer). The
     focus ring is left to the webkit component itself (its --ring-color token);
     no per-component ring override here. */
  :deep(.release-composition-control) {
    background: var(--surface-section) !important;
    border-color: var(--surface-border) !important;
  }
</style>
