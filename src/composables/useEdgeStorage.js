import { ref } from 'vue'

/**
 * Composable for managing EdgeStorage buckets locally (mocked data).
 * @returns {Object} Object containing buckets array and management functions.
 */
const buckets = ref([
  {
    id: 1,
    name: 'my-bucket',
    region: 'us-east-1',
    createdAt: new Date(),
    size: '0.2 GB',
    objectCount: 0,
    setting: 'read_write',
    files: [
      {
        id: Date.now(),
        name: '[FOLDER] documents',
        size: null,
        lastModified: new Date().toLocaleString(),
        isFolder: true,
        files: [
          {
            id: Date.now() + 1,
            name: 'file-folder-1.txt',
            size: '100 KB',
            lastModified: new Date().toLocaleString(),
            isFolder: false
          },
          {
            id: Date.now() + 2,
            name: 'file-folder-2.txt',
            size: '200 KB',
            lastModified: new Date().toLocaleString(),
            isFolder: false
          }
        ]
      },
      {
        id: Date.now() + 1,
        name: 'file.txt',
        size: '100 KB',
        lastModified: new Date().toLocaleString(),
        isFolder: false
      },
      {
        id: Date.now() + 2,
        name: 'file2.txt',
        size: '200 KB',
        lastModified: new Date().toLocaleString(),
        isFolder: false
      }
    ]
  },
  {
    id: 2,
    name: 'my-bucket-2',
    region: 'us-east-1',
    createdAt: new Date().toLocaleString(),
    size: '0.2 GB',
    objectCount: 0,
    setting: 'read_write',
    files: []
  }
])
const selectedBucket = ref(buckets.value[0])

const formatSize = (size) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  if (size == 0) return 'n/a'
  const aux = Math.floor(Math.log(size) / Math.log(1024))
  return (size / Math.pow(1024, aux)).toFixed(2) + ' ' + sizes[aux]
}

// Array to store uploaded files
const files = ref([])
export const useEdgeStorage = () => {
  /**
   * Adds a new bucket to the buckets array.
   * @param {Object} bucket - The bucket object to add.
   * @param {string} bucket.name - Bucket name.
   * @param {string} bucket.region - Bucket region.
   * @param {Date} [bucket.createdAt] - Creation date (defaults to now).
   * @param {string} [bucket.size] - Bucket size (defaults to '0 GB').
   * @param {number} [bucket.objectCount] - Number of objects (defaults to 0).
   */
  const addBucket = (bucket) => {
    const newBucket = {
      id: Date.now(),
      name: bucket.name,
      region: bucket.region,
      createdAt: bucket.createdAt || new Date().toLocaleString(),
      size: formatSize(bucket.size),
      objectCount: bucket.objectCount || 0,
      setting: bucket.edgeAccess
    }

    buckets.value.push(newBucket)
    return newBucket
  }

  /**
   * Deletes a bucket from the buckets array based on its ID.
   * @param {number|string} id - The ID of the bucket to delete.
   * @returns {boolean} True if bucket was found and deleted, false otherwise.
   */
  const deleteBucket = (id) => {
    const index = buckets.value.findIndex((bucket) => bucket.id === id)

    if (index !== -1) {
      buckets.value.splice(index, 1)
      return true
    }

    return false
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
   * Updates a bucket's properties.
   * @param {number|string} id - The ID of the bucket to update.
   * @param {Object} updates - Object containing the properties to update.
   * @returns {Object|null} The updated bucket object or null if not found.
   */
  const updateBucket = (id, updates) => {
    const bucket = findBucketById(id)

    if (bucket) {
      Object.assign(bucket, updates)
      return bucket
    }

    return null
  }

  /**
   * Gets the total count of buckets.
   * @returns {number} Total number of buckets.
   */
  const getBucketCount = () => {
    return buckets.value.length
  }

  /**
   * Clears all buckets (useful for testing or reset functionality).
   */
  const clearAllBuckets = () => {
    buckets.value.splice(0, buckets.value.length)
  }

  /**
   * Adds files to the files array with name and size information.
   * @param {FileList|File[]} fileList - The files to add (from drag/drop or file input).
   * @param {number|string} bucketId - The ID of the bucket to upload files to.
   */
  const addFiles = (fileList, bucketId) => {
    const bucket = findBucketById(bucketId)

    if (bucket) {
      const filesArray = Array.from(fileList)
      filesArray.forEach((file) => {
        bucket.files.push({
          name: file.name,
          size: formatSize(file.size),
          id: Date.now(),
          lastModified: new Date(),
          isFolder: false
        })
      })
    }
  }

  const handleFileSelect = (event, bucketId) => {
    const files = event.target.files
    if (files.length > 0) {
      addFiles(files, bucketId)
      event.target.value = ''
    }
  }

  /**
   * Gets files for a specific bucket.
   * @param {number|string} bucketId - The ID of the bucket.
   * @returns {Array} Array of files for the specified bucket.
   */
  const getFilesByBucket = (bucketId) => {
    return buckets.value.find((bucket) => bucket.id === bucketId)?.files || []
  }

  /**
   * Removes a file from the files array.
   * @param {number|string} fileId - The ID of the file to remove.
   * @returns {boolean} True if file was found and removed, false otherwise.
   */
  const removeFile = (fileId) => {
    const index = buckets.value.findIndex((bucket) => bucket.id === fileId)

    if (index !== -1) {
      buckets.value.splice(index, 1)
      return true
    }

    return false
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
        lastModified: new Date(),
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

  return {
    buckets,
    selectedBucket,
    files,
    addBucket,
    deleteBucket,
    findBucketById,
    updateBucket,
    getBucketCount,
    clearAllBuckets,
    addFiles,
    getFilesByBucket,
    removeFile,
    removeFiles,
    handleFileSelect,
    createFolder
  }
}
