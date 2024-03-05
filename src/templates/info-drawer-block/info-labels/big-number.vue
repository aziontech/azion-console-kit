<script setup>
  defineOptions({ name: 'big-number' })
  const props = defineProps({
    label: {
      type: String,
      required: true
    },
    sufix: {
      type: String,
      required: false
    }
  })

  defineExpose({ props })
</script>

<template>
  <div class="flex flex-col w-full">
    <label class="flex text-sm gap-1 items-center">
      {{ props.label }}
      <span class="pi pi-question-circle text-color-primary" />
    </label>
    <div class="flex gap-1 items-center">
      <span class="text-2xl font-bold">
        <slot></slot>
      </span>
      <span class="text-sm text-color">{{ props.sufix }}</span>
    </div>
  </div>
</template>
