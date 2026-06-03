<template>
  <div
    class="bg-surface flex items-center justify-between h-14 pl-6 pr-3 border-b border-[var(--border-muted)]"
  >
    <span class="text-base leading-none text-default">{{ label }}</span>
    <slot name="action" />
  </div>
</template>

<script setup>
  defineOptions({ name: 'plan-card-header' })

  defineProps({
    label: { type: String, required: true }
  })
</script>
