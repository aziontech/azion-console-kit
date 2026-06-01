<script setup>
  import { computed, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import ButtonHighlight from '@aziontech/webkit/button-highlight'
  import { useLayout } from '@/composables/use-layout'

  defineOptions({ name: 'ButtonCopilot' })

  const route = useRoute()
  const { toggleSidebarComponent } = useLayout()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  
  const currentLabel = computed(() => currentWidth.value > SCREEN_BREAKPOINT_MD ? 'Copilot' : '')
  const showButton = computed(() => route.name !== 'copilot')
</script>

<template>
  <ButtonHighlight
    v-if="showButton"
    icon="pi pi-sparkles"
    size="medium"
    :label="currentLabel"
    @click="toggleSidebarComponent('copilot')"
  /> 
</template>
