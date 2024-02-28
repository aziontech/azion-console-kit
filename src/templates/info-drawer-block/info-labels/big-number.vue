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
  <div class="flex flex-col sm:w-60 w-44 whitespace-nowrap">
    <label class="flex text-sm gap-1 items-center font-medium">
      {{ props.label }}
      <span class="pi pi-question-circle text-color-primary" />
    </label>
    <div class="flex gap-1 items-center">
      <span class="text-2xl font-bold">
        <slot></slot>
      </span>
      <span class="text-color">{{ props.sufix }}</span>
    </div>
  </div>
</template>
