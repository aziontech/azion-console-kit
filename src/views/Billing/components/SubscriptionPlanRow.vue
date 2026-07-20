<template>
  <div class="flex h-5 items-center justify-between text-[13px] leading-5">
    <span class="text-color-secondary">{{ label }}</span>
    <slot />
  </div>
</template>

<script setup>
  defineOptions({ name: 'subscription-plan-row' })

  defineProps({
    label: { type: String, required: true }
  })
</script>
