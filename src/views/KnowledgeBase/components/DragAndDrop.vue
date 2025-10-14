<template>
  <div class="flex w-full items-center justify-center">
    <div
      class="flex flex-col items-center gap-5 justify-center w-full mx-auto text-center py-16 border border-solid surface-border rounded-lg transition-colors"
      @dragover.prevent
      @dragenter.prevent
      @drop.prevent="handleDrop"
    >
      <div
        class="rounded-full border surface-border flex items-center justify-center w-[90px] h-[90px] mb-1"
      >
        <i class="pi pi-cloud-upload text-4xl text-color-primary"></i>
      </div>

      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-medium text-color-primary">
          Drag documents here to add them to your knowledge base
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

      <p class="text-sm text-color-secondary">Only PDF and TXT files are supported. Files larger than 300 MB cannot be uploaded.</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept=".pdf,.txt"
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useKnowledgeBase } from '@/composables/useKnowledgeBase'

  const props = defineProps({
    kbId: {
      type: String,
      required: true
    }
  })

  const emit = defineEmits(['reload'])
  const { uploadDocuments } = useKnowledgeBase()
  const fileInput = ref(null)

  const openFileSelector = () => {
    fileInput.value?.click()
  }

  const handleFileChange = async (event) => {
    const files = event.target.files
    if (files.length) {
      await uploadDocuments(files, props.kbId)
      emit('reload')
    }
  }

  const handleDrop = async (event) => {
    event.stopPropagation()
    const files = event.dataTransfer.files
    if (files.length) {
      await uploadDocuments(files, props.kbId)
      emit('reload')
    }
  }
</script>
