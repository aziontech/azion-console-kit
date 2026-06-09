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
        v-if="operationType === EDGE_STORAGE_OPERATION_TYPE.UPLOAD"
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
  import ProgressBar from '@aziontech/webkit/progressbar'
  import PrimeButton from '@aziontech/webkit/button'
  import { computed } from 'vue'
  import { useEdgeStorage, EDGE_STORAGE_OPERATION_TYPE } from '@/composables/useEdgeStorage'

  const { isProcessing, operationType, processStatus, cancelRequest } = useEdgeStorage()

  const showProgress = computed(() => {
    return isProcessing.value
  })

  const currentStatus = computed(() => {
    return processStatus.value
  })

  const iconClass = computed(() => {
    if (operationType.value === EDGE_STORAGE_OPERATION_TYPE.UPLOAD) return 'pi pi-file'
    if (operationType.value === EDGE_STORAGE_OPERATION_TYPE.MOVE)
      return 'pi pi-arrow-right-arrow-left'
    return 'pi pi-trash'
  })

  const actionText = computed(() => {
    if (operationType.value === EDGE_STORAGE_OPERATION_TYPE.UPLOAD) return 'Uploading'
    if (operationType.value === EDGE_STORAGE_OPERATION_TYPE.MOVE) return 'Moving'
    return 'Deleting'
  })

  const itemText = computed(() => {
    return 'files'
  })

  const handleCancel = () => {
    cancelRequest()
  }
</script>
