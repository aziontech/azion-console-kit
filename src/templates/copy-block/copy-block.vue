<template>
  <div>
    <PrimeButton
      :icon="icon"
      outlined
      data-testid="copy-block__copy-button"
      type="button"
      :aria-label="labelText"
      :label="labelText"
      :disabled="disabled"
      @click="animate"
      style="font-size: 0.875rem"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onBeforeUnmount } from 'vue'
  import PrimeButton from 'primevue/button'
  const emit = defineEmits(['copy'])
  import * as Helpers from '@/helpers'

  const props = defineProps({
    label: {
      type: String
    },
    disabled: {
      type: Boolean
    },
    value: {
      type: String,
      required: true
    }
  })
  const copied = ref(false)
  let timeoutId = null

  const icon = computed(() => (copied.value ? 'pi pi-check' : 'pi pi-copy'))

  const labelText = computed(() => {
    if (!props.label) return ''
    return copied.value ? 'Copied' : props.label
  })

  const animate = () => {
    copied.value = true
    emit('copy')
    Helpers.clipboardWrite(props.value)

    if (timeoutId) clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      copied.value = false
      timeoutId = null
    }, 2000)
  }

  onBeforeUnmount(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
</script>
