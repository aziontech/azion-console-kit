<template>
  <PrimeButton
    v-if="showButton"
    @click="toggleSidebarComponent('copilot')"
    :class="buttonClasses"
    size="small"
    class="special-button"
    v-tooltip.bottom="{ value: 'Azion Copilot', showDelay: 200 }"
  >
    <div
      class="special-button-content shadow !shadow-[#ffffff50] w-[30px] h-[30px] md:w-auto justify-center md:justify-start"
      :class="aiChatIsOpen"
    >
      <i class="ai ai-ask-azion"></i>{{ currentLabel }}
    </div>
  </PrimeButton>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { useLayout } from '@/composables/use-layout'
  import { useRoute } from 'vue-router'
  import ButtonHighlight from '@aziontech/webkit/button-highlight'
  import { useLayout } from '@/composables/use-layout'

  defineOptions({ name: 'ButtonCopilot' })

  const route = useRoute()
  const { toggleSidebarComponent } = useLayout()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const currentLabel = computed(() => (currentWidth.value > SCREEN_BREAKPOINT_MD ? 'Copilot' : ''))
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
