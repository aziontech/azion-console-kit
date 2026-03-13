import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: {}, query: {} }))
}))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({ add: vi.fn() }))
}))

describe('useEdgeStorage.deleteMultipleFiles', () => {
  let useEdgeStorage
  let edgeStorageService

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    const serviceModule = await import('@/services/v2/edge-storage/edge-storage-service')
    edgeStorageService = serviceModule.edgeStorageService

    const composableModule = await import('@/composables/useEdgeStorage')
    useEdgeStorage = composableModule.useEdgeStorage
  })

  it('deletes files with the existing bulk file service', async () => {
    vi.spyOn(edgeStorageService, 'deleteMultipleEdgeStorageBucketFiles').mockResolvedValueOnce([
      { fileName: 'readme.md', success: true }
    ])

    const { deleteMultipleFiles, selectedBucket, folderPath } = useEdgeStorage()
    selectedBucket.value = { name: 'test-bucket' }
    folderPath.value = ''

    await deleteMultipleFiles([{ name: 'readme.md', isFolder: false }])

    expect(edgeStorageService.deleteMultipleEdgeStorageBucketFiles).toHaveBeenCalledWith(
      'test-bucket',
      ['readme.md'],
      expect.any(Function)
    )
  })

  it('prefixes files with folderPath before deleting them', async () => {
    vi.spyOn(edgeStorageService, 'deleteMultipleEdgeStorageBucketFiles').mockResolvedValueOnce([
      { fileName: 'images/photo.jpg', success: true }
    ])

    const { deleteMultipleFiles, selectedBucket, folderPath } = useEdgeStorage()
    selectedBucket.value = { name: 'test-bucket' }
    folderPath.value = 'images/'

    await deleteMultipleFiles([{ name: 'photo.jpg', isFolder: false }])

    expect(edgeStorageService.deleteMultipleEdgeStorageBucketFiles).toHaveBeenCalledWith(
      'test-bucket',
      ['images/photo.jpg'],
      expect.any(Function)
    )
  })

  it('calls the recursive service for folders', async () => {
    vi.spyOn(edgeStorageService, 'deleteRecursiveBucketFolder').mockResolvedValueOnce([
      { fileName: 'docs/a.txt', success: true }
    ])

    const { deleteMultipleFiles, selectedBucket, folderPath } = useEdgeStorage()
    selectedBucket.value = { name: 'test-bucket' }
    folderPath.value = 'parent/'

    await deleteMultipleFiles([{ name: 'docs', isFolder: true }])

    expect(edgeStorageService.deleteRecursiveBucketFolder).toHaveBeenCalledWith(
      'test-bucket',
      'parent/docs/',
      expect.any(Function)
    )
  })

  it('handles mixed file and folder selection', async () => {
    vi.spyOn(edgeStorageService, 'deleteMultipleEdgeStorageBucketFiles').mockResolvedValueOnce([
      { fileName: 'readme.md', success: true }
    ])
    vi.spyOn(edgeStorageService, 'deleteRecursiveBucketFolder').mockResolvedValueOnce([
      { fileName: 'docs/a.txt', success: true }
    ])

    const { deleteMultipleFiles, selectedBucket, folderPath } = useEdgeStorage()
    selectedBucket.value = { name: 'test-bucket' }
    folderPath.value = ''

    await deleteMultipleFiles([
      { name: 'readme.md', isFolder: false },
      { name: 'docs', isFolder: true }
    ])

    expect(edgeStorageService.deleteMultipleEdgeStorageBucketFiles).toHaveBeenCalledWith(
      'test-bucket',
      ['readme.md'],
      expect.any(Function)
    )
    expect(edgeStorageService.deleteRecursiveBucketFolder).toHaveBeenCalledWith(
      'test-bucket',
      'docs/',
      expect.any(Function)
    )
  })
})
