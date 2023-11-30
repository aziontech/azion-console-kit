<template>
  <PrimeButton
    label="Preview"
    severity="primary"
    outlined
    class="flex md:hidden"
    @click="showMobilePreview = true"
  />
  <Sidebar
    :visible="showMobilePreview"
    position="bottom"
    :show-close-icon="false"
    :pt="{
      root: { class: '!h-[90%] md:hidden' },
      mask: { class: 'md:hidden' }
    }"
  >
    <template #header>
      <div class="flex w-full items-center justify-between">
        <h2>Preview</h2>
        <PrimeButton
          icon="pi pi-times"
          size="small"
          class="flex-none surface-border text-sm w-8 h-8"
          text
          @click="showMobilePreview = false"
        />
      </div>
    </template>
    <div class="h-full w-full">
      <CodePreview :updateObject="updateObject" />
    </div>
  </Sidebar>
</template>

<script setup>
  import { ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import Sidebar from 'primevue/sidebar'
  import CodePreview from './code-preview.vue'

  defineProps({
    updateObject: {
      type: Object,
      required: true
    }
  })

  const showMobilePreview = ref(false)
</script>
