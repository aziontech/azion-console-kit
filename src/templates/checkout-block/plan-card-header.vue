<template>
  <div class="bg-surface flex items-center justify-between px-6 py-3 border-b border-default">
    <span class="text-lg font-semibold text-default">{{ label }}</span>
    <slot name="action" />
  </div>
</template>

<script setup>
  defineOptions({ name: 'plan-card-header' })

  defineProps({
    label: { type: String, required: true }
  })
</script>
