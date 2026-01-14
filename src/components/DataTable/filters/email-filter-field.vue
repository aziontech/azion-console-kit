<script setup>
  import InputText from 'primevue/inputtext'

  defineProps({
    modelValue: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['update:modelValue', 'validation'])

  const handleInput = (value) => {
    emit('update:modelValue', value)
    emit('validation', true)
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <InputText
      :modelValue="modelValue"
      @update:modelValue="handleInput"
      placeholder="Search by email"
      type="text"
      class="w-full"
    />
  </div>
</template>
