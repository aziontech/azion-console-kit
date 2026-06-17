<template>
  <div
    v-if="label"
    class="flex items-center justify-between"
  >
    <span class="text-sm text-muted">{{ label }}</span>
    <div :class="disabled ? 'pointer-events-none opacity-60' : ''">
      <Toggle
        v-model="toggleValue"
        mainLabel="Monthly"
        alternativeLabel="Yearly"
      />
    </div>
  </div>
  <div
    v-else
    :class="disabled ? 'pointer-events-none opacity-60' : ''"
  >
    <Toggle
      v-model="toggleValue"
      mainLabel="Monthly"
      alternativeLabel="Yearly"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import Toggle from '@aziontech/webkit/toggle'

  defineOptions({ name: 'billing-cycle-toggle' })

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

  const toggleValue = computed({
    get: () => (props.modelValue === 'yearly' ? 'alternative' : 'main'),
    set: (value) => {
      if (props.disabled) return
      emit('update:modelValue', value === 'alternative' ? 'yearly' : 'monthly')
    }
  })
</script>
