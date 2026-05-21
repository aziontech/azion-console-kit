<template>
  <div
    v-if="label"
    class="flex items-center justify-between"
  >
    <span class="text-sm text-muted">{{ label }}</span>
    <div :class="disabled ? 'pointer-events-none opacity-60' : ''">
      <SegmentedButton
        v-model="cycleValue"
        :options="CYCLE_OPTIONS"
      />
    </div>
  </div>
  <div
    v-else
    :class="disabled ? 'pointer-events-none opacity-60' : ''"
  >
    <SegmentedButton
      v-model="cycleValue"
      :options="CYCLE_OPTIONS"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import SegmentedButton from '@aziontech/webkit/segmented-button'

  defineOptions({ name: 'billing-cycle-toggle' })

  const CYCLE_OPTIONS = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' }
  ]

  const props = defineProps({
    modelValue: {
      type: String,
      required: true,
      validator: (value) => ['monthly', 'yearly'].includes(value)
    },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  })

  const emit = defineEmits(['update:modelValue'])

  const cycleValue = computed({
    get: () => props.modelValue,
    set: (value) => {
      if (props.disabled) return
      emit('update:modelValue', value)
    }
  })
</script>
