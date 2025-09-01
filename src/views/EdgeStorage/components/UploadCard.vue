<template>
  <div
    v-if="isUploading"
    class="flex flex-col gap-3.5 p-5 bg-[--overlay-content-bg] border border-solid border-[--surface-border] rounded mb-2"
  >
    <div class="flex justify-between items-center gap-3.5">
      <div class="flex items-center gap-1.5">
        <i class="pi pi-file"></i>
        <span>{{ uploadStatus.current.name }}</span>
      </div>
      <PrimeButton
        icon="pi pi-times-circle"
        size="small"
        outlined
        label="Cancel"
        @click="isUploading = false"
      />
    </div>

    <div class="flex justify-between items-center text-sm">
      <span class="text-color-secondary">
        Uploading {{ uploadStatus.uploaded }} of {{ uploadStatus?.total }} files
      </span>
      <span class="font-medium">{{ uploadStatus.progress }}%</span>
    </div>
    <ProgressBar
      :value="uploadStatus.progress"
      style="height: 0.5em"
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
  const { isUploading, uploadStatus } = useEdgeStorage()
</script>
