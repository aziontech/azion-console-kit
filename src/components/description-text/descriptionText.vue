<template>
  <p
    v-if="size === 'normal' && !isHtml"
    :class="classData.normal"
    style="white-space: pre-line"
  >
    {{ description }}
  </p>
  <p
    v-else-if="size === 'normal' && isHtml"
    :class="classData.normal"
    style="white-space: pre-line"
    v-html="description"
  ></p>

  <p
    v-if="size === 'small' && !isHtml"
    :class="classData.small"
  >
    {{ description }}
  </p>
  <p
    v-else-if="size === 'small' && isHtml"
    v-html="description"
    :class="classData.small"
  ></p>
</template>

<script setup>
  defineProps({
    description: {
      type: String,
      required: true
    },
    isHtml: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'normal',
      options: () => ['small', 'normal']
    }
  })

  const classData = {
    small: 'text-xs text-color-secondary font-normal leading-5',
    normal: 'text-color-secondary text-sm font-normal flex flex-col gap-2'
  }
</script>
