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
      <span class="w-36 text-color text-sm font-medium">{{ props.label }}</span>
      <span class="w-full sm:w-52 text-color-secondary break-all text-sm">
        <slot></slot>
      </span>
    </div>
  </div>
</template>
