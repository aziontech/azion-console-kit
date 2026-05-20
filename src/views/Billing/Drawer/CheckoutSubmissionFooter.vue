<template>
  <div
    class="flex shrink-0 justify-end gap-3 border-t border-default bg-[var(--surface-50)] px-4 py-3 md:px-8"
  >
    <Button
      class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
      outlined
      label="Cancel"
      :disabled="isSubmitting"
      @click="$emit('cancel')"
    />
    <Button
      class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
      :label="submitLabel"
      :loading="isSubmitting"
      :disabled="isConfirmDisabled"
      @click="$emit('confirm')"
    />
  </div>
</template>

<script setup>
  import Button from '@aziontech/webkit/button'

  defineOptions({ name: 'checkout-submission-footer' })

  defineProps({
    submitLabel: { type: String, required: true },
    isSubmitting: { type: Boolean, default: false },
    isConfirmDisabled: { type: Boolean, default: false }
  })

  defineEmits(['cancel', 'confirm'])
</script>
