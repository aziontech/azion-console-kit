<template>
  <div
    class="flex shrink-0 gap-3 border-t border-[var(--border-default)] bg-surface px-4 lg:px-8 py-4 lg:justify-end"
  >
    <Button
      class="font-protomono flex items-center justify-center text-xs flex-1 lg:flex-none"
      :disabled="submitting"
      outlined
      label="Back"
      @click="$emit('back')"
    />
    <Button
      severity="secondary"
      class="font-protomono flex items-center justify-center text-xs flex-1 lg:flex-none"
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
