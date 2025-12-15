<template>
  <PrimeButton
    :class="buttonClass"
    :disabled="disabled"
    @click="handleClick"
    icon="pi pi-plus"
    :data-testid="testId"
    :label="label"
  />
</template>

<script setup>
  import PrimeButton from 'primevue/button'

  defineProps({
    label: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    buttonClass: {
      type: [String, Object, Array],
      default: 'max-sm:w-full'
    },
    testId: {
      type: String,
      default: null
    }
  })

  const emit = defineEmits(['click'])

  const handleClick = () => {
    emit('click')
  }
</script>
