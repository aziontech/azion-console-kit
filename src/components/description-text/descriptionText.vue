<template>
  <p
    :class="currentClass"
    :style="currentStyle"
    v-if="$slots.rawHtml"
  >
    <slot name="rawHtml" />
  </p>
  <p
    :class="currentClass"
    :style="currentStyle"
    v-else
  >
    {{ description }}
  </p>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    description: {
      type: String,
      required: true
    },
    size: {
      type: String,
      validator: (value) => ['normal', 'small'].includes(value),
      default: 'normal'
    }
  })

  const classData = {
    normal: 'text-color-secondary text-sm font-normal flex flex-col gap-2',
    small: 'text-xs text-color-secondary font-normal leading-5'
  }
  const currentClass = computed(() => classData[props.size])
  const currentStyle = computed(() => (props.size === 'normal' ? { whiteSpace: 'pre-line' } : {}))
</script>
