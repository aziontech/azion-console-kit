<script setup>
  import { ref, watch } from 'vue'
  import InputText from 'primevue/inputtext'

  const props = defineProps({
    modelValue: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['update:modelValue', 'validation'])

  const emailError = ref(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleInput = (value) => {
    emit('update:modelValue', value)

    if (value) {
      const isValid = validateEmail(value)
      emailError.value = !isValid
      emit('validation', isValid)
    } else {
      emailError.value = false
      emit('validation', true)
    }
  }

  watch(
    () => props.modelValue,
    (newValue) => {
      if (!newValue) {
        emailError.value = false
      }
    }
  )

  defineExpose({ validateEmail, emailError })
</script>

<template>
  <div class="flex flex-col gap-2">
    <InputText
      :modelValue="modelValue"
      @update:modelValue="handleInput"
      placeholder="Enter email"
      type="email"
      class="w-full"
      :class="{ 'p-invalid': emailError }"
    />
    <small
      v-if="emailError"
      class="text-red-500"
    >
      Please enter a valid email address
    </small>
  </div>
</template>
