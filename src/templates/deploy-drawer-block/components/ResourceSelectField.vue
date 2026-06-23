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
</script>

<template>
  <div class="flex flex-col gap-2">
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
          class="flex items-center gap-2"
        >
          <i class="pi pi-box text-[var(--text-color-secondary)]" />
          <span class="text-sm text-[var(--text-color)]">{{ selectedOption.label }}</span>
        </span>
        <span
          v-else
          class="text-sm text-[var(--text-color-secondary)]"
          >{{ placeholder }}</span
        >
      </template>
      <template #option="{ option }">
        <span class="flex w-full items-center gap-3">
          <i class="pi pi-box text-[var(--text-color-secondary)]" />
          <span class="text-sm font-medium text-[var(--text-color)] truncate">
            {{ option.label }}
          </span>
          <i
            v-if="option.value === modelValue"
            class="pi pi-check ml-auto text-[var(--text-primary)]"
          />
        </span>
      </template>
    </Dropdown>
  </div>
</template>
