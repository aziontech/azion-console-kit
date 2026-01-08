<script setup>
  import Dropdown from 'primevue/dropdown'

  defineProps({
    modelValue: {
      type: [String, Number, Boolean],
      default: ''
    },
    options: {
      type: Array,
      required: true
    },
    placeholder: {
      type: String,
      default: 'Select an option'
    }
  })

  const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <Dropdown
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :options="options"
    optionLabel="label"
    optionValue="value"
    :placeholder="placeholder"
    class="w-[50%]"
  />
</template>
