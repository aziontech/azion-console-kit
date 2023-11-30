<template>
  <div class="gap-2 flex items-center">
    <component :is="languageIcon[language]" />
    <p>{{ value }}</p>
  </div>
</template>

<script setup>
  import { defineAsyncComponent } from 'vue'

  defineProps({
    language: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  })

  const languageIcon = {
    javascript: defineAsyncComponent(() => import('@/assets/svg/js-logo.vue')),
    lua: defineAsyncComponent(() => import('@/assets/svg/lua-logo.vue'))
  }
</script>
