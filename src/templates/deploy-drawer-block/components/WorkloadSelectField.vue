<script setup>
  /**
   * WorkloadSelectField — dumb/presentational dropdown for picking the target
   * workload. No data fetching and no derivation: the parent block feeds
   * `options` (already adapted to `{ label, value }`) and reacts to selection
   * through `update:modelValue`. The composable owns everything else.
   */
  import Dropdown from '@aziontech/webkit/dropdown'
  import LabelBlock from '@aziontech/webkit/label'

  defineOptions({ name: 'deploy-drawer-workload-select-field' })

  defineProps({
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
</script>

<template>
  <div class="flex flex-col gap-2">
    <LabelBlock
      label="Workload"
      name="deploy-drawer-workload-select"
    />
    <Dropdown
      inputId="deploy-drawer-workload-select"
      :modelValue="modelValue"
      :options="options"
      optionLabel="label"
      optionValue="value"
      placeholder="Select a workload"
      :loading="loading"
      :disabled="disabled"
      class="w-full"
      data-testid="deploy-drawer__workload-select"
      @update:modelValue="onChange"
    />
  </div>
</template>
