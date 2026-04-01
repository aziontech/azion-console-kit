<template>
  <PrimeDialog
    blockScroll
    modal
    visible
    :closeOnEscape="false"
    :header="dialogHeader"
    :draggable="false"
    class="max-w-2xl p-0"
    @keydown.esc="cancelDialog"
    data-testid="move-object-dialog"
    :pt="{
      content: {
        class: 'p-0'
      }
    }"
  >
    <div
      class="flex flex-col"
      data-testid="move-object-dialog-content"
    >
      <div
        class="px-8 py-5 flex flex-col gap-3.5"
        data-testid="move-object-dialog-description"
      >
        <p class="text-color-secondary text-sm leading-5">
          {{ descriptionText }}
        </p>
      </div>

      <Divider class="m-0" />

      <div
        class="px-8 py-5 flex flex-col gap-3.5"
        data-testid="move-object-dialog-form"
      >
        <div
          class="flex flex-col w-full gap-2"
          data-testid="move-object-dialog-input-wrapper"
        >
          <label
            for="destination-input"
            class="font-medium text-sm text-color"
            data-testid="move-object-dialog-input-label"
          >
            Folder destination
          </label>
          <InputText
            id="destination-input"
            type="text"
            autofocus
            v-model="destinationPath"
            :class="{ 'p-invalid': hasError }"
            placeholder="/ (root)"
            data-testid="move-object-dialog-input-field"
          />
          <small
            v-if="hasError"
            class="p-error text-xs font-normal leading-tight"
            data-testid="move-object-dialog-input-error"
          >
            {{ errorMessage }}
          </small>
        </div>
      </div>
    </div>

    <template #closeicon>
      <PrimeButton
        outlined
        @click="cancelDialog()"
        icon="pi pi-times"
      />
    </template>

    <template #footer>
      <PrimeButton
        outlined
        label="Cancel"
        size="small"
        @click="cancelDialog()"
        data-testid="move-object-dialog-footer-cancel-button"
      />
      <PrimeButton
        label="Move"
        size="small"
        @click="confirmMove()"
        data-testid="move-object-dialog-footer-move-button"
      />
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { computed, ref, inject } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import InputText from '@aziontech/webkit/inputtext'
  import Divider from '@aziontech/webkit/divider'

  defineOptions({ name: 'move-object-dialog' })

  const dialogRef = inject('dialogRef')

  const data = dialogRef.value.data
  const destinationPath = ref('')
  const hasError = ref(false)
  const errorMessage = ref('')

  const currentFolderPath = computed(() => data.currentFolderPath || '')

  const dialogHeader = computed(() => {
    if (data.files.length > 1) {
      return `Move ${data.files.length} file(s)`
    }
    return `Move ${data.files[0].name}`
  })

  const descriptionText = computed(() => {
    const fileCount = data.files.length
    const totalSize = data.totalSize || ''
    const sizeText = totalSize ? ` ${totalSize}` : ''
    return `You are moving ${fileCount} File(s)${sizeText}. Type the destination folder path or leave empty for the bucket root.`
  })

  const normalizeDestinationPath = (path) => {
    let normalized = path.trim()
    if (!normalized) return ''
    normalized = normalized.replace(/\/+/g, '/')
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1)
    }
    if (normalized && !normalized.endsWith('/')) {
      normalized = normalized + '/'
    }
    return normalized
  }

  const validateDestination = () => {
    const normalized = normalizeDestinationPath(destinationPath.value)
    //eslint-disable-next-line
    const specialCharRegex = /[^\u0020-\u007F]/g

    if (destinationPath.value.trim() && specialCharRegex.test(destinationPath.value)) {
      hasError.value = true
      errorMessage.value = 'Destination path contains invalid characters.'
      return false
    }

    if (normalized === currentFolderPath.value) {
      hasError.value = true
      errorMessage.value = 'Destination is the same as the current folder.'
      return false
    }

    hasError.value = false
    errorMessage.value = ''
    return true
  }

  const confirmMove = () => {
    if (!validateDestination()) return

    const normalized = normalizeDestinationPath(destinationPath.value)
    dialogRef.value.close({ updated: true, destinationPath: normalized })
  }

  const cancelDialog = () => {
    dialogRef.value.close({ updated: false })
  }
</script>
