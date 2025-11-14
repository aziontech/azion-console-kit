<template>
  <div
    v-if="showProgress"
    class="flex flex-col gap-3.5 p-5 bg-[--overlay-content-bg] border border-solid border-[--surface-border] rounded mb-2"
  >
    <div class="flex justify-between items-center gap-3.5">
      <div class="flex items-center gap-1.5">
        <i :class="iconClass"></i>
        <span>{{ currentStatus.current?.name || 'Processing...' }}</span>
      </div>
      <PrimeButton
        v-if="operationType === 'upload'"
        icon="pi pi-times-circle"
        size="small"
        outlined
        label="Cancel"
        @click="handleCancel"
      />
    </div>

    <div class="flex justify-between items-center text-sm">
      <span class="text-color-secondary">
        {{ actionText }} {{ currentStatus.completed || currentStatus.uploaded || 0 }} of
        {{ currentStatus.total }} {{ itemText }}
      </span>
      <span class="font-medium">{{ currentStatus.progress }}%</span>
    </div>
    <ProgressBar
      :value="currentStatus.progress"
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
  import { computed } from 'vue'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'

  const { isProcessing, operationType, processStatus } = useEdgeStorage()

  const showProgress = computed(() => {
    return isProcessing.value
  })

  const currentStatus = computed(() => {
    return processStatus.value
  })

  const iconClass = computed(() => {
    return operationType.value === 'upload' ? 'pi pi-file' : 'pi pi-trash'
  })

  const actionText = computed(() => {
    return operationType.value === 'upload' ? 'Uploading' : 'Deleting'
  })

  const itemText = computed(() => {
    return 'files'
  })

  const handleCancel = () => {
    isProcessing.value = false
  }
</script>
