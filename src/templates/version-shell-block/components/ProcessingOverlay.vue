<script setup>
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import PrimeButton from '@aziontech/webkit/button'
  import { isProcessing } from '@/composables/versioning/version-machine'

  defineOptions({ name: 'processing-overlay' })

  defineProps({
    state: {
      type: String,
      required: true
    },
    canCancel: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['cancel'])

  const handleCancel = () => emit('cancel')
</script>

<template>
  <div
    v-if="isProcessing(state)"
    class="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface-section)]/80 backdrop-blur-sm"
    data-testid="processing-overlay"
  >
    <div
      class="flex flex-col items-center gap-[var(--spacing-4)] p-[var(--spacing-6)] rounded-[var(--shape-elements)] bg-[var(--surface-section)] border border-[var(--surface-border)] shadow-[var(--shadow-md)]"
    >
      <ProgressSpinner
        class="w-10 h-10 text-[var(--text-color)]"
        strokeWidth="4"
      />
      <span class="text-[var(--text-color)] text-body-sm font-medium">Building version...</span>
      <PrimeButton
        v-if="canCancel"
        severity="secondary"
        size="small"
        label="Cancel"
        data-testid="processing-overlay__cancel"
        @click="handleCancel"
      />
    </div>
  </div>
</template>
