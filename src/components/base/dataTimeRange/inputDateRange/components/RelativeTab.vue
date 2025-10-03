<template>
  <div class="flex flex-col gap-4">
    <div class="space-y-2">
      <InputNumber
        :model-value="relativeValue"
        :min="1"
        :max="maxValue"
        showButtons
        class="w-full"
      />
    </div>

    <div class="space-y-2">
      <Dropdown
        :model-value="relativeUnit"
        :options="RELATIVE_UNITS"
        optionLabel="label"
        optionValue="value"
        @update:model-value="$emit('unitChange', $event)"
        class="w-full"
      />
    </div>
  </div>
</template>

<script setup>
  import Dropdown from 'primevue/dropdown'
  import InputNumber from 'primevue/inputnumber'
  import { RELATIVE_UNITS } from '@utils/date.js'
  import { computed } from 'vue'

  defineOptions({ name: 'RelativeTab' })

  const props = defineProps({
    relativeValue: {
      type: Number,
      required: true
    },
    relativeUnit: {
      type: String,
      required: true
    },
    maxDays: {
      type: Number,
      default: 0
    }
  })

  defineEmits(['valueChange', 'unitChange'])

  const maxValue = computed(() => {
    if (props.maxDays === 0) return 999

    switch (props.relativeUnit) {
      case 'minutes':
        return Math.min(999, props.maxDays * 24 * 60)
      case 'hours':
        return Math.min(999, props.maxDays * 24)
      case 'days':
        return Math.min(999, props.maxDays)
      case 'weeks':
        return Math.min(999, Math.floor(props.maxDays / 7))
      case 'months':
        return Math.min(999, Math.floor(props.maxDays / 30))
      case 'years':
        return Math.min(999, Math.floor(props.maxDays / 365))
      default:
        return 999
    }
  })
</script>
