<template>
  <div
    class="flex shrink-0 justify-end gap-3 border-t border-[var(--border-default)] bg-[var(--surface-50)] px-4 py-3 md:px-8"
  >
    <ActionButton
      kind="outlined"
      size="medium"
      label="Cancel"
      :disabled="isSubmitting"
      @click="$emit('cancel')"
    />
    <ActionButton
      kind="primary"
      size="medium"
      :label="submitLabel"
      :loading="isSubmitting"
      :disabled="isConfirmDisabled"
      @click="$emit('confirm')"
    />
  </div>
</template>

<script setup>
  import ActionButton from '@aziontech/webkit/actions/button'

  defineOptions({ name: 'checkout-submission-footer' })

  defineProps({
    submitLabel: { type: String, required: true },
    isSubmitting: { type: Boolean, default: false },
    isConfirmDisabled: { type: Boolean, default: false }
  })

  defineEmits(['cancel', 'confirm'])
</script>
