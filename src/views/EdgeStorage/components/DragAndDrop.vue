<template>
  <div class="flex w-full items-center justify-center">
    <div
      class="flex flex-col items-center gap-8 justify-center w-full mx-auto text-center py-16 border border-solid surface-border rounded-lg transition-colors"
      @dragover.prevent
      @dragenter.prevent
      @drop.prevent="handleDrop"
    >
      <div
        class="rounded-full border surface-border flex items-center justify-center w-[90px] h-[90px]"
      >
        <i class="pi pi-cloud-upload text-4xl text-color-primary"></i>
      </div>

      <h3 class="text-lg font-medium text-color-primary mb-2">
        Drag files here to add them to your bucket
      </h3>

      <p class="text-color-secondary mb-4">
        Or
        <span
          class="cursor-pointer text-[var(--text-color-link)] transition-colors"
          @click="openFileSelector"
          >choose your files</span
        >
      </p>

      <p class="text-sm text-color-secondary">Files larger than 300 MB cannot be uploaded.</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      class="hidden"
      @change="(event) => handleFileSelect(event, selectedBucket.id)"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'

  const props = defineProps({
    selectedBucket: {
      type: Object,
      required: true
    }
  })

  const { addFiles, handleFileSelect } = useEdgeStorage()
  const fileInput = ref(null)

  const handleDrop = (event) => {
    const files = event.dataTransfer.files
    if (files.length > 0 && props.selectedBucket) {
      addFiles(files, props.selectedBucket.id)
    }
  }

  const openFileSelector = () => {
    fileInput.value?.click()
  }
</script>
