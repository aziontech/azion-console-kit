<template>
  <div
    class="flex shrink-0 flex-col gap-2 border-t border-default bg-[var(--surface-50)] px-4 py-3 md:px-8"
  >
    <div
      v-if="errorMessage"
      class="flex items-start gap-2 rounded-md border border-error bg-[var(--surface-error)] px-3 py-2 text-xs text-error"
    >
      <i class="pi pi-exclamation-circle mt-[2px] shrink-0" />
      <span class="flex-1">{{ errorMessage }}</span>
    </div>

    <div class="flex justify-end gap-3">
      <Button
        class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
        outlined
        label="Cancel"
        :disabled="isSubmitting"
        @click="$emit('cancel')"
      />
      <Button
        class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
        :label="confirmLabel"
        :loading="isSubmitting"
        :disabled="isConfirmDisabled"
        @click="$emit('confirm')"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import Button from '@aziontech/webkit/button'

  defineOptions({ name: 'checkout-submission-footer' })

  const props = defineProps({
    submitLabel: { type: String, required: true },
    errorMessage: { type: String, default: '' },
    isSubmitting: { type: Boolean, default: false },
    isConfirmDisabled: { type: Boolean, default: false }
  })

  defineEmits(['cancel', 'confirm'])

  const confirmLabel = computed(() => (props.errorMessage ? 'Retry' : props.submitLabel))
</script>
