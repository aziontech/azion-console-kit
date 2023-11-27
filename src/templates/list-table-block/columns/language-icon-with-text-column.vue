<template>
  <div class="gap-2 flex items-center">
    <component :is="languageIcon" />
    <p>{{ value }}</p>
  </div>
</template>

<script setup>
  import { computed, defineAsyncComponent } from 'vue'

  const props = defineProps({
    language: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  })

  const languageIcon = computed(() => {
    switch (props.language) {
      case 'javascript':
        return defineAsyncComponent(() => import('@/assets/svg/js-logo.vue'))
      case 'lua':
        return defineAsyncComponent(() => import('@/assets/svg/lua-logo.vue'))
      default:
        throw new Error('Invalid column appearance')
    }
  })
</script>
