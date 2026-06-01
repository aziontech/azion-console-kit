<template>
  <div
    class="flex shrink-0 gap-3 border-t border-[var(--border-default)] bg-surface px-4 lg:px-8 py-4 lg:justify-end"
  >
    <Button
      kind="outlined"
      size="medium"
      :disabled="submitting"
      label="Back"
      @click="$emit('back')"
      class="font-protomono flex items-center justify-center text-xs flex-1 lg:flex-none"
    />
    <Button
      kind="secondary"
      size="medium"
      :loading="loading"
      :disabled="disabled"
      label="Subscribe"
      @click="$emit('submit')"
      class="font-protomono flex items-center justify-center text-xs flex-1 lg:flex-none"
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
