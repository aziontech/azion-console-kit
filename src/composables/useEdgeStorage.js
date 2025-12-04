import { ref, computed } from 'vue'
import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
import { useToast } from 'primevue/usetoast'
import * as yup from 'yup'
import { formatBytes } from '@/helpers/format-bytes'
import JSZip from 'jszip'

/**
 * Composable for managing EdgeStorage buckets locally (mocked data).
 * @returns {Object} Object containing buckets array and management functions.
 */
const buckets = ref([])
const selectedBucket = ref()
const isProcessing = ref(false)
const operationType = ref('') // 'upload' or 'delete'
const itemsToProcess = ref([])
const processCount = ref(1)
const currentProcessingItem = ref(null)
const processedItems = ref([])
const failedItems = ref([])
const currentItemProgress = ref(0)
const totalBytesProcessed = ref(0)
const totalBytesToProcess = ref(0)
const bucketTableNeedRefresh = ref(true)
const filesTableNeedRefresh = ref(false)
const selectedFiles = ref([])
const isDownloading = ref(false)
const showDragAndDrop = ref(false)
const folderPath = ref('')

const processProgress = computed(() => {
  if (operationType.value === 'upload') {
    if (!totalBytesToProcess.value) return 0
    const completedFilesBytes = processedItems.value.reduce((sum, file) => sum + file.size, 0)
    const currentFileBytes =
      currentItemProgress.value > 0 && currentProcessingItem.value
        ? (currentProcessingItem.value.sizeBytes * currentItemProgress.value) / 100
        : 0
    const totalProgress =
      ((completedFilesBytes + currentFileBytes) / totalBytesToProcess.value) * 100
    return Math.round(Math.min(totalProgress, 100))
  } else if (operationType.value === 'delete') {
    return currentItemProgress.value
  }
  return 0
})

const processStatus = computed(() => {
  return {
    total: itemsToProcess.value.length,
    uploaded: operationType.value === 'upload' ? processCount.value : 0,
    deleted: operationType.value === 'delete' ? processCount.value : 0,
    completed: processCount.value,
    failed: failedItems.value.length,
    current: currentProcessingItem.value,
    progress: processProgress.value,
    currentFileProgress: currentItemProgress.value,
    totalBytesUploaded: totalBytesProcessed.value,
    totalBytesToUpload: totalBytesToProcess.value,
    bytesRemaining: totalBytesToProcess.value - totalBytesProcessed.value
  }
})
const nameRegex = /^[A-Za-z0-9_-]+$/
const edgeAccess = ['read_write', 'read_only', 'restricted']

const validationSchema = yup.object({
  name: yup
    .string()
    .label('Name')
    .required()
    .min(6)
    .max(63)
    .test('name', 'Invalid name format', (value) => nameRegex.test(value)),
  edge_access: yup
    .string()
    .label('Edge Access')
    .required()
    .default('read_write')
    .test('edge_access', 'Invalid edge access format', (value) => edgeAccess.includes(value))
})

export const useEdgeStorage = () => {
  const toast = useToast()
  const handleToast = (severity, summary, message) => {
    toast.add({
      severity: severity,
      summary: summary,
      detail: message,
      life: severity === 'error' ? 10000 : 5000
    })
  }
  /**
   * Finds a bucket by its ID.
   * @param {number|string} id - The ID of the bucket to find.
   * @returns {Object|undefined} The bucket object if found, undefined otherwise.
   */
  const findBucketById = (id) => {
    return buckets.value.find((bucket) => bucket.id === id)
  }
  /**
   * Adds files to the files array with name and size information.
   * @param {FileList|File[]} fileList - The files to add (from drag/drop or file input).
   * @param {number|string} bucketId - The ID of the bucket to upload files to.
   */
  const uploadFiles = async (fileList) => {
    if (selectedBucket.value) {
      const filesArray = Array.from(fileList)
      const maxFileSize = 300 * 1024 * 1024 // 300MB in bytes
      //eslint-disable-next-line
      const specialCharRegex = /[^\u0020-\u007F]/g
      const invalidNameFiles = filesArray.filter((file) => specialCharRegex.test(file.name))

      if (invalidNameFiles.length) {
        handleToast(
          'error',
          'Invalid File Names',
          `${invalidNameFiles.length} file${
            invalidNameFiles.length > 1 ? 's have' : ' has'
          } accented characters or cedilla. These characters are not allowed in file names.`
        )
        filesTableNeedRefresh.value = false
        return
      }

      const oversizedFiles = filesArray.filter((file) => file.size > maxFileSize)

      if (oversizedFiles.length) {
        handleToast(
          'warn',
          'File Size Limit Exceeded',
          `${oversizedFiles.length} file${
            oversizedFiles.length > 1 ? 's' : ''
          } exceed the 300MB limit and cannot be uploaded.`
        )

        const validFiles = filesArray.filter((file) => file.size <= maxFileSize)

        if (!validFiles.length) {
          return
        }

        itemsToProcess.value = validFiles
      } else {
        itemsToProcess.value = filesArray
      }

      operationType.value = 'upload'
      isProcessing.value = true
      processCount.value = 1
      processedItems.value = []
      failedItems.value = []
      currentProcessingItem.value = null
      currentItemProgress.value = 0
      totalBytesProcessed.value = 0
      totalBytesToProcess.value = itemsToProcess.value.reduce((sum, file) => sum + file.size, 0)

      try {
        for (const file of itemsToProcess.value) {
          currentProcessingItem.value = {
            name: file.name,
            size: formatBytes(file.size),
            sizeBytes: file.size
          }
          currentItemProgress.value = 0

          const onProgress = (progress) => {
            currentItemProgress.value = progress.percentage
          }
          try {
            await edgeStorageService.addEdgeStorageBucketFiles(
              file,
              selectedBucket.value.name,
              onProgress,
              folderPath.value
            )
            processedItems.value.push(file)
            totalBytesProcessed.value += file.size
            currentItemProgress.value = 100
            processCount.value++
          } catch (fileError) {
            failedItems.value.push({ file, error: fileError })
          }
        }

        currentProcessingItem.value = null
        isProcessing.value = false

        const successCount = processedItems.value.length
        const failureCount = failedItems.value.length

        if (successCount) {
          filesTableNeedRefresh.value = true
          showDragAndDrop.value = false
          handleToast(
            failureCount > 0 ? 'warn' : 'success',
            failureCount > 0 ? 'Upload Partially Completed' : 'Upload Successful',
            failureCount > 0
              ? `${successCount} file${
                  successCount > 1 ? 's' : ''
                } uploaded successfully, ${failureCount} failed`
              : `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`
          )
        }

        if (failureCount && !successCount) {
          if (failedItems.value.filter((file) => file.error.status === 413).length > 0) {
            handleToast(
              'error',
              'File Too Large',
              `${failedItems.value.filter((file) => file.error.status === 413).length} file${
                failedItems.value.filter((file) => file.error.status === 413).length > 1 ? 's' : ''
              } exceed file size limit and cannot be uploaded.`
            )
          } else {
            handleToast(
              'error',
              'Upload Failed',
              `All ${failureCount} file${failureCount > 1 && 's'} failed to upload`
            )
          }
        }
      } catch (error) {
        currentProcessingItem.value = null
        isProcessing.value = false

        handleToast(
          'error',
          'Upload Failed',
          'An unexpected error occurred during upload. Please try again.'
        )
      }
    }
  }
  /**
   * Creates a new folder in a bucket.
   * @param {string} folderName - The name of the folder to create.
   * @param {number|string} bucketId - The ID of the bucket to create the folder in.
   * @returns {Object|null} The created folder object or null if bucket not found.
   */
  const createFolder = (folderName, bucketId) => {
    const bucket = findBucketById(bucketId)

    if (bucket) {
      const newFolder = {
        id: Date.now(),
        name: folderName,
        size: null,
        lastModified: new Date().toLocaleString(),
        isFolder: true
      }
      bucket.files.push(newFolder)
      return newFolder
    }

    return null
  }

  const removeFiles = async (fileIds) => {
    for (const fileId of fileIds) {
      await edgeStorageService.deleteEdgeStorageBucketFiles(selectedBucket.value.name, fileId)
      filesTableNeedRefresh.value = true
    }
  }

  const deleteMultipleFiles = async (fileNames) => {
    if (!selectedBucket.value || !fileNames.length) return

    itemsToProcess.value = fileNames
    operationType.value = 'delete'
    isProcessing.value = true
    processCount.value = 1
    processedItems.value = []
    failedItems.value = []
    currentProcessingItem.value = null
    currentItemProgress.value = 0

    try {
      const onProgress = (progress) => {
        currentProcessingItem.value = {
          name: progress.fileName
        }
        currentItemProgress.value = progress.percentage
        processCount.value = progress.completed
      }

      const results = await edgeStorageService.deleteMultipleEdgeStorageBucketFiles(
        selectedBucket.value.name,
        fileNames.map((file) => (folderPath.value ? folderPath.value + file : file)),
        onProgress
      )

      const successResults = results.filter((result) => result.success)
      const failureResults = results.filter((result) => !result.success)

      processedItems.value = successResults
      failedItems.value = failureResults

      currentProcessingItem.value = null
      isProcessing.value = false

      const successCount = successResults.length
      const failureCount = failureResults.length

      if (successCount) {
        filesTableNeedRefresh.value = true

        const hasFailures = failureCount > 0
        const toastType = hasFailures ? 'warn' : 'success'
        const toastTitle = hasFailures ? 'Deletion Partially Completed' : 'Deletion Successful'
        const successText = `${successCount} file${
          successCount > 1 ? 's' : ''
        } deleted successfully`
        const toastMessage = hasFailures ? `${successText}, ${failureCount} failed` : successText

        handleToast(toastType, toastTitle, toastMessage)
      }

      if (failureCount && !successCount) {
        handleToast(
          'error',
          'Deletion Failed',
          `All ${failureCount} file${failureCount > 1 ? 's' : ''} failed to delete`
        )
      }
    } catch (error) {
      currentProcessingItem.value = null
      isProcessing.value = false

      handleToast(
        'error',
        'Deletion Failed',
        'An unexpected error occurred during deletion. Please try again.'
      )
    }
  }

  const handleFileChange = async (event) => {
    const files = event.dataTransfer?.files || event.target?.files
    if (files.length) {
      await uploadFiles(files)
      event.target.value = ''
    }
  }

  const handleDownload = async (file) => {
    try {
      isDownloading.value = true
      const link = document.createElement('a')
      if (!file?.length) {
        const fileData = await edgeStorageService.downloadEdgeStorageBucketFiles(
          selectedBucket.value.name,
          folderPath.value ? folderPath.value + file.name : file.name
        )
        const blob = new Blob([fileData], {
          type: 'application/octet-stream'
        })
        link.href = window.URL.createObjectURL(blob)
        link.download = file.name
      } else {
        const zip = new JSZip()

        for (const file of selectedFiles.value) {
          const fileData = await edgeStorageService.downloadEdgeStorageBucketFiles(
            selectedBucket.value.name,
            folderPath.value ? folderPath.value + file.name : file.name
          )
          zip.file(file.name, fileData)
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        link.href = window.URL.createObjectURL(zipBlob)

        const currentDate = new Date().toISOString().split('T')[0]
        const filename = `${selectedBucket.value.name}_${currentDate}.zip`

        link.download = filename
        selectedFiles.value = []
      }
      link.click()
    } catch (error) {
      handleToast('error', 'Error downloading files', error.message)
    } finally {
      isDownloading.value = false
    }
  }

  return {
    buckets,
    selectedBucket,
    isProcessing,
    operationType,
    itemsToProcess,
    processCount,
    processStatus,
    currentProcessingItem,
    processedItems,
    failedItems,
    currentItemProgress,
    totalBytesProcessed,
    totalBytesToProcess,
    findBucketById,
    uploadFiles,
    createFolder,
    removeFiles,
    deleteMultipleFiles,
    bucketTableNeedRefresh,
    validationSchema,
    handleFileChange,
    filesTableNeedRefresh,
    handleDownload,
    selectedFiles,
    isDownloading,
    showDragAndDrop,
    folderPath
  }
}
