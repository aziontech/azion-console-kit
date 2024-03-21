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
  <div class="flex items-start sm:items-center w-full gap-3">
    <span class="w-36 text-color text-sm font-medium">{{ props.label }}</span>
    <div class="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <span class="text-color-secondary break-all text-sm">
        <slot></slot>
      </span>
      <slot name="button"></slot>
    </div>
  </div>
</template>
