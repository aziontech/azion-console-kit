<template>
  <div class="flex w-full items-center justify-center">
    <div
      class="flex flex-col items-center gap-5 justify-center w-full mx-auto text-center py-16 border border-solid surface-border rounded-lg transition-colors"
    >
      <div
        class="rounded-full border surface-border flex items-center justify-center w-[90px] h-[90px] mb-1"
      >
        <i class="pi pi-cloud-upload text-4xl text-color-primary"></i>
      </div>

      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-medium text-color-primary">
          Drag files here to add them to your bucket
        </h3>

        <p class="text-color-secondary">
          Or
          <span
            class="cursor-pointer text-[var(--text-color-link)] transition-colors hover:underline"
            @click="openFileSelector"
            >choose your files</span
          >
        </p>
      </div>

      <p class="text-sm text-color-secondary">Files larger than 300 MB cannot be uploaded.</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      class="hidden"
      @change="handleFileChangeDragDrop"
    />
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'

  const { handleFileChange } = useEdgeStorage()
  const fileInput = ref(null)
  const emit = defineEmits(['reload'])

  const openFileSelector = () => {
    fileInput.value?.click()
  }

  const handleFileChangeDragDrop = async (event) => {
    await handleFileChange(event)
    emit('reload')
  }

  const handleDocumentDragOver = (event) => {
    event.preventDefault()
  }

  const handleDocumentDragEnter = (event) => {
    event.preventDefault()
  }

  const handleDocumentDrop = (event) => {
    event.preventDefault()
    handleFileChangeDragDrop(event)
  }

  const handleDocumentDragLeave = (event) => {
    event.preventDefault()
  }

  const setupDocumentDragEvents = () => {
    document.addEventListener('dragover', handleDocumentDragOver)
    document.addEventListener('dragenter', handleDocumentDragEnter)
    document.addEventListener('drop', handleDocumentDrop)
    document.addEventListener('dragleave', handleDocumentDragLeave)
  }

  const removeDocumentDragEvents = () => {
    document.removeEventListener('dragover', handleDocumentDragOver)
    document.removeEventListener('dragenter', handleDocumentDragEnter)
    document.removeEventListener('drop', handleDocumentDrop)
    document.removeEventListener('dragleave', handleDocumentDragLeave)
  }

  onMounted(() => {
    setupDocumentDragEvents()
  })

  onUnmounted(() => {
    removeDocumentDragEvents()
  })
</script>
