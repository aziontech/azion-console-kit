<template>
  <PrimeButton
    label="Preview"
    severity="primary"
    outlined
    :class="[buttonClasses]"
    @click="showMobilePreview = true"
  />
  <Sidebar
    :visible="showMobilePreview"
    position="bottom"
    :show-close-icon="false"
    :pt="{
      root: { class: '!h-[90%] md:hidden' },
      headerContent: { class: 'w-full' },
      mask: { class: 'md:hidden' }
    }"
  >
    <template #header>
      <div class="flex w-full items-center justify-between">
        <h2>Preview</h2>
        <div class="flex gap-2">
          <ConsoleFeedback />
          <PrimeButton
            icon="pi pi-times"
            size="small"
            class="flex-none surface-border text-sm w-8 h-8"
            text
            @click="showMobilePreview = false"
          />
        </div>
      </div>
    </template>
    <div class="h-full w-full">
      <CodePreview :updateObject="updateObject" />
    </div>
  </Sidebar>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import Sidebar from 'primevue/sidebar'
  import CodePreview from './code-preview.vue'
  import ConsoleFeedback from '@/templates/navbar-block/feedback'

  const props = defineProps({
    updateObject: {
      type: Object,
      required: true
    },
    language: {
      type: String
    }
  })

  const buttonClasses = computed(() => {
    return props.language !== 'lua' ? 'flex md:hidden' : 'hidden'
  })

  const showMobilePreview = ref(false)
</script>
