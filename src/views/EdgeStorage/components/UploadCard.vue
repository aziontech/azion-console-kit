<template>
  <div
    v-if="isUploading"
    class="flex flex-col gap-3.5 p-5 bg-[--overlay-content-bg] border border-solid border-[--surface-border] rounded"
  >
    <div class="flex justify-between items-center gap-3.5">
      <div class="flex items-center gap-1.5">
        <i class="pi pi-file"></i>
        <span>{{ fileToUpload[uploadCount - 1]?.name }}</span>
      </div>
      <PrimeButton
        icon="pi pi-times-circle"
        size="small"
        outlined
        label="Cancel"
        @click="isUploading = false"
      />
    </div>
    <span class="text-sm text-color-secondary"
      >Uploading {{ uploadCount }} of {{ fileToUpload.length }}</span
    >
    <ProgressBar
      :value="uploadProgress"
      style="height: 6px"
      :showValue="false"
      :pt="{
        value: { style: 'background-color: var(--primary-color) !important' }
      }"
    />
  </div>
</template>

<script setup>
  import ProgressBar from 'primevue/progressbar'

  import PrimeButton from 'primevue/button'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  const { isUploading, uploadCount, uploadProgress, fileToUpload } = useEdgeStorage()
</script>
