<script setup>
  defineOptions({ name: 'text-info' })
  const props = defineProps({
    label: {
      type: String,
      required: true
    },
  })

  defineExpose({ props })
</script>

<template>
  <div>
    <div class="flex w-full gap-3">
      <span class="w-[144px] text-color text-sm">{{ props.label }}</span>
      <span class="w-[212px] text-color-secondary break-all text-sm">
        <slot></slot>
      </span>
    </div>
  </div>
</template>
