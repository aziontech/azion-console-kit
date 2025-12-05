<script setup>
  import InputText from 'primevue/inputtext'

  defineProps({
    modelValue: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <InputText
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    placeholder="Enter value"
    class="w-full"
  />
</template>
