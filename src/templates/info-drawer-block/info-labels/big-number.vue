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
  <div class="flex flex-col sm:w-[234px] w-[172px] whitespace-nowrap">
    <label class="flex text-sm gap-1 items-center">
      {{ props.label }}
      <span class="pi pi-question-circle text-color-secondary" />
    </label>
    <div class="flex gap-1 items-center">
      <span class="text-2xl font-semibold">
        <slot></slot>
      </span>
      <span class="text-color-secondary">{{ props.sufix }}</span>
    </div>
  </div>
</template>
