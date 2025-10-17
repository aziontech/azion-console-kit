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
const isUploading = ref(false)
const fileToUpload = ref([])
const uploadCount = ref(1)
const currentUploadingFile = ref(null)
const uploadedFiles = ref([])
const failedFiles = ref([])
const currentFileProgress = ref(0)
const totalBytesUploaded = ref(0)
const totalBytesToUpload = ref(0)
const bucketTableNeedRefresh = ref(true)
const filesTableNeedRefresh = ref(false)
const selectedFiles = ref([])
const isDownloading = ref(false)
const showDragAndDrop = ref(false)
const folderPath = ref('')

const uploadProgress = computed(() => {
  if (!totalBytesToUpload.value) return 0
  const completedFilesBytes = uploadedFiles.value.reduce((sum, file) => sum + file.size, 0)
  const currentFileBytes =
    currentFileProgress.value > 0 && currentUploadingFile.value
      ? (currentUploadingFile.value.sizeBytes * currentFileProgress.value) / 100
      : 0
  const totalProgress = ((completedFilesBytes + currentFileBytes) / totalBytesToUpload.value) * 100
  return Math.round(Math.min(totalProgress, 100))
})

const uploadStatus = computed(() => {
  return {
    total: fileToUpload.value.length,
    uploaded: uploadCount.value,
    failed: failedFiles.value.length,
    current: currentUploadingFile.value,
    progress: uploadProgress.value,
    currentFileProgress: currentFileProgress.value,
    totalBytesUploaded: totalBytesUploaded.value,
    totalBytesToUpload: totalBytesToUpload.value,
    bytesRemaining: totalBytesToUpload.value - totalBytesUploaded.value
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

        fileToUpload.value = validFiles
      } else {
        fileToUpload.value = filesArray
      }

      isUploading.value = true
      uploadCount.value = 1
      uploadedFiles.value = []
      failedFiles.value = []
      currentUploadingFile.value = null
      currentFileProgress.value = 0
      totalBytesUploaded.value = 0
      totalBytesToUpload.value = fileToUpload.value.reduce((sum, file) => sum + file.size, 0)

      try {
        for (const file of fileToUpload.value) {
          currentUploadingFile.value = {
            name: file.name,
            size: formatBytes(file.size),
            sizeBytes: file.size
          }
          currentFileProgress.value = 0

          const onProgress = (progress) => {
            currentFileProgress.value = progress.percentage
          }
          try {
            await edgeStorageService.addEdgeStorageBucketFiles(
              file,
              selectedBucket.value.name,
              onProgress,
              folderPath.value
            )
            uploadedFiles.value.push(file)
            totalBytesUploaded.value += file.size
            currentFileProgress.value = 100
            uploadCount.value++
          } catch (fileError) {
            failedFiles.value.push({ file, error: fileError })
          }
        }

        currentUploadingFile.value = null
        isUploading.value = false

        const successCount = uploadedFiles.value.length
        const failureCount = failedFiles.value.length

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
          if (failedFiles.value.filter((file) => file.error.status === 413).length > 0) {
            handleToast(
              'error',
              'File Too Large',
              `${failedFiles.value.filter((file) => file.error.status === 413).length} file${
                failedFiles.value.filter((file) => file.error.status === 413).length > 1 ? 's' : ''
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
        currentUploadingFile.value = null
        isUploading.value = false

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
    isUploading,
    fileToUpload,
    uploadCount,
    uploadProgress,
    uploadStatus,
    currentUploadingFile,
    uploadedFiles,
    failedFiles,
    currentFileProgress,
    totalBytesUploaded,
    totalBytesToUpload,
    findBucketById,
    uploadFiles,
    createFolder,
    removeFiles,
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
