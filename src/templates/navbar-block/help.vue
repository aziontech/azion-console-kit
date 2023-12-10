<template>
  <PrimeButton
    :label="currentLabel"
    @click="helpCenterStore.toggle()"
    :pt="{
      label: { class: 'text-white' },
      icon: { class: 'text-white' }
    }"
    :class="{
      'bg-header hover:bg-header-button-hover': !helpCenterStore.isOpen,
      'bg-header-button-enabled': helpCenterStore.isOpen
    }"
    icon="pi pi-question-circle"
    size="small"
    class="text-white border-header"
    v-tooltip.bottom="{ value: 'Help', showDelay: 200 }"
  />
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useHelpCenterStore } from '@/stores/help-center'

import PrimeButton from 'primevue/button'

defineOptions({ name: 'navbar-help-block' })

const helpCenterStore = useHelpCenterStore()
const currentWidth = ref(0)

onMounted(() => {
  currentWidth.value = window.innerWidth
  window.addEventListener('resize', () => {
    currentWidth.value = window.innerWidth
  })
})

const currentLabel = computed(() => {
  if (currentWidth.value > 768) {
    return 'Help'
  }
  return ''
})
</script>
