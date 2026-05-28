<template>
  <div
    class="flex shrink-0 justify-end gap-3 border-t border-[var(--border-default)] bg-surface px-6 lg:px-8 py-4"
  >
    <Button
      class="font-protomono flex items-center justify-center text-xs"
      :disabled="submitting"
      outlined
      label="Back"
      @click="$emit('back')"
    />
    <Button
      severity="secondary"
      class="font-protomono flex items-center justify-center text-xs"
      :loading="loading"
      :disabled="disabled"
      label="Subscribe"
      @click="$emit('submit')"
    />
  </div>
</template>

<script setup>
  import Button from '@aziontech/webkit/button'

  defineOptions({ name: 'checkout-action-footer' })

  defineProps({
    submitting: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
  })

  defineEmits(['back', 'submit'])
</script>
