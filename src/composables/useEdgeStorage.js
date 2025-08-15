import { ref, computed } from 'vue'
import { edgeStorageService } from '@/services/v2'
import { useToast } from 'primevue/usetoast'
import * as yup from 'yup'
import { formatBytes } from '@/helpers/format-bytes'

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
const createdBucket = ref('')
const needRefresh = ref(false)

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
      needRefresh.value = true
      const filesArray = Array.from(fileList)
      const maxFileSize = 300 * 1024 * 1024 // 300MB in bytes

      const oversizedFiles = filesArray.filter((file) => file.size > maxFileSize)

      if (oversizedFiles.length) {
        toast.add({
          severity: 'warn',
          summary: 'File Size Limit Exceeded',
          detail: `${oversizedFiles.length} file${
            oversizedFiles.length > 1 ? 's' : ''
          } exceed the 300MB limit and cannot be uploaded.`,
          life: 5000
        })

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
              onProgress
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
          toast.add({
            severity: failureCount > 0 ? 'warn' : 'success',
            summary: failureCount > 0 ? 'Upload Partially Completed' : 'Upload Successful',
            detail:
              failureCount > 0
                ? `${successCount} file${
                    successCount > 1 ? 's' : ''
                  } uploaded successfully, ${failureCount} failed`
                : `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`,
            life: 5000
          })
        }

        if (failureCount && !successCount) {
          toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: `All ${failureCount} file${failureCount > 1 ? 's' : ''} failed to upload`,
            life: 5000
          })
        }
      } catch (error) {
        currentUploadingFile.value = null
        isUploading.value = false

        toast.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'An unexpected error occurred during upload. Please try again.',
          life: 5000
        })
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

  const removeFiles = (fileIds) => {
    const bucket = findBucketById(selectedBucket.value.id)
    if (bucket) {
      bucket.files = bucket.files.filter((file) => !fileIds.includes(file.id))
    }
  }

  const removeCredential = (credentialId) => {
    const bucket = findBucketById(selectedBucket.value.id)
    if (bucket) {
      bucket.credentials = bucket.credentials.filter((credential) => credential.id !== credentialId)
    }
  }

  const addCredential = (credentialData) => {
    const bucket = findBucketById(selectedBucket.value.id)
    if (bucket) {
      const accessKey = 'AKIA' + Math.random().toString(36).substring(2, 15).toUpperCase()
      const secretKey =
        Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)

      const newCredential = {
        id: Date.now(),
        name: credentialData.name,
        accessKey,
        secretKey,
        createdAt: new Date().toLocaleString(),
        expiresAt: credentialData.expirationDate.toLocaleString(),
        capacities: 'Content'
      }

      bucket.credentials.push(newCredential)
      return newCredential
    }
    return null
  }
  const handleFileChange = async (event) => {
    const files = event.dataTransfer?.files || event.target?.files
    if (files.length) {
      await uploadFiles(files)
      event.target.value = ''
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
    removeCredential,
    addCredential,
    createdBucket,
    validationSchema,
    handleFileChange,
    needRefresh
  }
}
