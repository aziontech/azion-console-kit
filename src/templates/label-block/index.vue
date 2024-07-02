<script setup>
  import { defineProps } from 'vue'

  defineOptions({ name: 'label-block' })

  const props = defineProps({
    label: {
      type: String,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: false
    }
  })
</script>

<template>
  <label
    v-bind="$attrs"
    class="text-color text-base font-medium leading-5 flex gap-1 align-items-center"
  >
    {{ props.label }}
    <div
      v-if="props.isRequired"
      class="text-sm text-orange-500"
    >
      *
      <span class="text-[0.625rem] text-color-secondary">(Required)</span>
    </div>
  </label>
</template>
