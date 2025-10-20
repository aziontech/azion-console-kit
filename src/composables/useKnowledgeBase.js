import { ref } from 'vue'
import {
  createDocumentService,
  deleteDocumentService
} from '@/services/knowledge-base-services/document-service'
import { useToast } from 'primevue/usetoast'

const selectedKnowledgeBase = ref(null)
const selectedDocuments = ref([])
const isUploading = ref(false)
const documentsToUpload = ref([])
const uploadedDocuments = ref([])
const failedDocuments = ref([])
const uploadStatus = ref({
  current: { name: '' },
  uploaded: 0,
  total: 0,
  progress: 0
})

export const useKnowledgeBase = () => {
  const toast = useToast()

  const handleToast = (severity, summary, message) => {
    toast.add({
      severity: severity,
      summary: summary,
      detail: message,
      life: 5000
    })
  }

  const uploadDocuments = async (fileList, kbId) => {
    if (!kbId) {
      handleToast('error', 'Error', 'Knowledge Base ID is required')
      return
    }

    // Reset state before starting new upload
    uploadedDocuments.value = []
    failedDocuments.value = []

    const filesArray = Array.from(fileList)
    const maxFileSize = 300 * 1024 * 1024 // 300MB in bytes
    const allowedExtensions = ['pdf', 'txt']

    // Validate files
    const validFiles = []
    const oversizedFiles = []
    const invalidTypeFiles = []

    filesArray.forEach((file) => {
      const extension = file.name.split('.').pop().toLowerCase()

      if (!allowedExtensions.includes(extension)) {
        invalidTypeFiles.push(file.name)
      } else if (file.size > maxFileSize) {
        oversizedFiles.push(file.name)
      } else {
        validFiles.push(file)
      }
    })

    // Show validation warnings
    if (invalidTypeFiles.length > 0) {
      handleToast(
        'warn',
        'Invalid File Types',
        `${invalidTypeFiles.length} file${
          invalidTypeFiles.length > 1 ? 's' : ''
        } skipped. Only PDF and TXT files are supported.`
      )
    }

    if (oversizedFiles.length > 0) {
      handleToast(
        'warn',
        'File Size Limit Exceeded',
        `${oversizedFiles.length} file${
          oversizedFiles.length > 1 ? 's' : ''
        } exceed the 300MB limit and cannot be uploaded.`
      )
    }

    if (validFiles.length === 0) {
      return
    }

    // Start upload process
    isUploading.value = true
    documentsToUpload.value = validFiles
    uploadStatus.value = {
      current: { name: '' },
      uploaded: 0,
      total: validFiles.length,
      progress: 0
    }

    try {
      for (let index = 0; index < validFiles.length; index++) {
        const file = validFiles[index]
        uploadStatus.value.current = { name: file.name }

        try {
          await createDocumentService(kbId, file)
          uploadedDocuments.value.push(file)
          uploadStatus.value.uploaded = index + 1
          uploadStatus.value.progress = Math.round(((index + 1) / validFiles.length) * 100)
        } catch (fileError) {
          failedDocuments.value.push({ file, error: fileError })
          uploadStatus.value.uploaded = index + 1
          uploadStatus.value.progress = Math.round(((index + 1) / validFiles.length) * 100)
        }
      }

      isUploading.value = false

      const successCount = uploadedDocuments.value.length
      const failureCount = failedDocuments.value.length

      // Show appropriate feedback
      if (successCount > 0) {
        handleToast(
          failureCount > 0 ? 'warn' : 'success',
          failureCount > 0 ? 'Upload Partially Completed' : 'Upload Successful',
          failureCount > 0
            ? `${successCount} document${
                successCount > 1 ? 's' : ''
              } uploaded successfully, ${failureCount} failed`
            : `${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully`
        )
      }

      if (failureCount > 0 && successCount === 0) {
        handleToast(
          'error',
          'Upload Failed',
          `All ${failureCount} document${failureCount > 1 ? 's' : ''} failed to upload`
        )
      }
    } catch (error) {
      isUploading.value = false
      handleToast(
        'error',
        'Upload Failed',
        'An unexpected error occurred during upload. Please try again.'
      )
    }
  }

  const removeDocuments = async (kbId, documentIds) => {
    for (const documentId of documentIds) {
      await deleteDocumentService(kbId, documentId)
    }
  }

  return {
    selectedKnowledgeBase,
    selectedDocuments,
    isUploading,
    documentsToUpload,
    uploadedDocuments,
    failedDocuments,
    uploadStatus,
    uploadDocuments,
    removeDocuments,
    handleToast
  }
}
