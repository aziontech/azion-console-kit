<script setup>
  defineOptions({ name: 'text-info' })
  const props = defineProps({
    label: {
      type: String,
      required: true
    }
  })

  defineExpose({ props })
</script>

<template>
  <div>
    <div class="flex w-full gap-3">
      <span class="w-[9rem] text-color text-sm font-medium">{{ props.label }}</span>
      <span class="w-[13.25rem] text-color-secondary break-all text-sm">
        <slot></slot>
      </span>
    </div>
  </div>
</template>
