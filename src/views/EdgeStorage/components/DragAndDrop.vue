<template>
  <div class="flex w-full items-center justify-center">
    <div
      class="flex flex-col items-center gap-5 justify-center w-full mx-auto text-center py-16 border border-solid surface-border rounded-lg transition-colors"
    >
      <!-- Loading State -->
      <template v-if="isLoading">
        <Skeleton
          shape="circle"
          width="90px"
          height="90px"
          class="mb-1"
        />
        <div class="flex flex-col gap-4 items-center">
          <Skeleton
            width="280px"
            height="1.5rem"
          />
          <Skeleton
            width="100px"
            height="2rem"
          />
        </div>
        <Skeleton
          width="250px"
          height="1rem"
        />
      </template>

      <!-- Empty State -->
      <template v-else>
        <div
          class="rounded-full border surface-border flex items-center justify-center w-[90px] h-[90px] mb-1"
        >
          <i class="pi pi-cloud-upload text-4xl text-color-primary"></i>
        </div>

        <div class="flex flex-col gap-4">
          <h3 class="text-lg font-medium text-color-primary">
            Drag files here to add them to your bucket
          </h3>

          <div class="flex justify-center">
            <SplitButton
              size="small"
              label="Add to files"
              @click="openFileSelector('files')"
              :model="uploadMenuItems"
              primary
              class="whitespace-nowrap"
              :disabled="isProcessing"
              :menuButtonProps="{
                class: 'rounded-l-none',
                style: { color: 'var(--primary-text-color) !important' }
              }"
              :pt="{
                root: { class: 'h-[2rem]' }
              }"
            />
          </div>
        </div>

        <p class="text-sm text-color-secondary">Files larger than 300 MB cannot be uploaded.</p>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted } from 'vue'
  import SplitButton from 'primevue/splitbutton'
  import Skeleton from 'primevue/skeleton'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'

  defineProps({
    isLoading: {
      type: Boolean,
      default: false
    }
  })

  const { uploadFiles, isProcessing } = useEdgeStorage()
  const emit = defineEmits(['reload'])

  const uploadMenuItems = [
    {
      label: 'Upload folder',
      icon: 'pi pi-folder',
      command: () => openFileSelector('folder')
    },
    {
      label: 'Upload files',
      icon: 'pi pi-upload',
      command: () => openFileSelector('files')
    }
  ]

  const openFileSelector = (type = 'files') => {
    if (isProcessing.value) return

    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'

    if (type === 'folder') {
      input.webkitdirectory = true
      input.multiple = false
    } else {
      input.multiple = true
      input.webkitdirectory = false
    }

    input.onchange = async (event) => {
      const files = event.target.files
      if (files.length) {
        await uploadFiles(files)
        emit('reload')
      }
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  }

  const handleDocumentDragOver = (event) => {
    event.preventDefault()
  }

  const handleDocumentDragLeave = (event) => {
    event.preventDefault()
  }

  const setupDocumentDragEvents = () => {
    document.addEventListener('dragover', handleDocumentDragOver)
    document.addEventListener('dragenter', handleDocumentDragOver)
    document.addEventListener('dragleave', handleDocumentDragLeave)
  }

  const removeDocumentDragEvents = () => {
    document.removeEventListener('dragover', handleDocumentDragOver)
    document.removeEventListener('dragenter', handleDocumentDragOver)
    document.removeEventListener('dragleave', handleDocumentDragLeave)
  }

  onMounted(() => {
    setupDocumentDragEvents()
  })

  onUnmounted(() => {
    removeDocumentDragEvents()
  })
</script>
