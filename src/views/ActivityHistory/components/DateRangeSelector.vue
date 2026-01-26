<script setup>
  import { computed } from 'vue'
  import Dropdown from 'primevue/dropdown'
  import PrimeButton from 'primevue/button'

  const props = defineProps({
    modelValue: {
      type: Number,
      default: 30
    }
  })

  const emit = defineEmits(['update:modelValue', 'change'])

  const dateRangeOptions = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 }
  ]

  const selectedRange = computed({
    get: () => props.modelValue,
    set: (value) => {
      emit('update:modelValue', value)
      emit('change', value)
    }
  })
</script>

<template>
  <div class="flex items-center">
    <PrimeButton
      outlined
      icon="pi pi-calendar"
      class="border-r-0 rounded-r-none h-8"
      :pt="{
        root: { class: 'pointer-events-none' }
      }"
    />
    <Dropdown
      v-model="selectedRange"
      :options="dateRangeOptions"
      optionLabel="label"
      optionValue="value"
      class="h-8 rounded-l-none border-l-0 w-[150px]"
      :pt="{
        input: { class: 'py-0 flex items-center' }
      }"
    />
  </div>
</template>
