<template>
  <button
    v-if="showButton"
    type="button"
    @click="toggleSidebarComponent('copilot')"
    :class="buttonClasses"
    class="special-button inline-flex items-center justify-center h-9 rounded-[var(--shape-button)] px-2"
    v-tooltip.bottom="{ value: 'Azion Copilot', showDelay: 200 }"
  >
    <div
      class="special-button-content shadow !shadow-[#ffffff50] w-9 h-9 md:w-auto justify-center md:justify-start"
      :class="aiChatIsOpen"
    >
      <i class="ai ai-ask-azion"></i>{{ currentLabel }}
    </div>
  </button>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { useLayout } from '@/composables/use-layout'
  import { useRoute } from 'vue-router'

  defineOptions({ name: 'ButtonCopilot' })
  const { isSidebarActive, toggleSidebarComponent, activeComponentKey } = useLayout()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Copilot'
    }
    return ''
  })

  const route = useRoute()

  const showButton = computed(() => {
    return route.name !== 'copilot'
  })

  const aiChatIsOpen = computed(() => {
    return isSidebarActive.value && activeComponentKey.value === 'copilot'
      ? 'bg-header/40'
      : 'bg-header/80 hover:bg-[#00000025]'
  })

  const buttonClasses = computed(() => {
    return isSidebarActive.value && activeComponentKey.value === 'copilot'
      ? 'bg-header-button-enabled'
      : 'bg-header hover:bg-header-button-hover'
  })
</script>
