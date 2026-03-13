import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EdgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
import { EDGE_STORAGE_DELETE_STEP } from '@/composables/useEdgeStorage'

describe('EdgeStorageService.deleteRecursiveBucketFolder', () => {
  let service
  let httpRequestSpy

  beforeEach(() => {
    service = new EdgeStorageService()
    httpRequestSpy = vi.fn()
    service.http = { request: httpRequestSpy }
  })

  it('collects all pages before starting deletes', async () => {
    httpRequestSpy
      .mockResolvedValueOnce({
        data: {
          results: [{ key: 'folder/file-1.txt', is_folder: false }],
          continuation_token: 'page-2'
        }
      })
      .mockResolvedValueOnce({
        data: {
          results: [{ key: 'folder/sub/file-2.txt', is_folder: false }],
          continuation_token: null
        }
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    const onProgress = vi.fn()
    const results = await service.deleteRecursiveBucketFolder('bucket-name', 'folder/', onProgress)

    expect(httpRequestSpy).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: 'v4/workspace/storage/buckets/bucket-name/objects',
      params: {
        all_levels: true,
        prefix: 'folder/',
        max_object_count: 110,
        continuation_token: ''
      }
    })

    expect(httpRequestSpy).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      url: 'v4/workspace/storage/buckets/bucket-name/objects',
      params: {
        all_levels: true,
        prefix: 'folder/',
        max_object_count: 110,
        continuation_token: 'page-2'
      }
    })

    expect(httpRequestSpy).toHaveBeenNthCalledWith(3, {
      method: 'DELETE',
      url: `v4/workspace/storage/buckets/bucket-name/objects/${encodeURIComponent('folder/file-1.txt')}`
    })

    expect(httpRequestSpy).toHaveBeenNthCalledWith(4, {
      method: 'DELETE',
      url: `v4/workspace/storage/buckets/bucket-name/objects/${encodeURIComponent('folder/sub/file-2.txt')}`
    })

    expect(results).toEqual([
      {
        fileName: 'folder/file-1.txt',
        success: true,
        message: expect.any(String)
      },
      {
        fileName: 'folder/sub/file-2.txt',
        success: true,
        message: expect.any(String)
      }
    ])

    expect(onProgress).toHaveBeenNthCalledWith(1, {
      fileName: 'folder/',
      completed: 1,
      percentage: -1,
      step: EDGE_STORAGE_DELETE_STEP.LISTING
    })

    expect(onProgress).toHaveBeenNthCalledWith(2, {
      fileName: 'folder/',
      completed: 2,
      percentage: -1,
      step: EDGE_STORAGE_DELETE_STEP.LISTING
    })

    expect(onProgress).toHaveBeenNthCalledWith(3, {
      fileName: 'folder/file-1.txt',
      completed: 1,
      total: 2,
      percentage: 50,
      step: EDGE_STORAGE_DELETE_STEP.DELETING
    })

    expect(onProgress).toHaveBeenNthCalledWith(4, {
      fileName: 'folder/sub/file-2.txt',
      completed: 2,
      total: 2,
      percentage: 100,
      step: EDGE_STORAGE_DELETE_STEP.DELETING
    })
  })

  it('returns an empty result when the folder has no objects', async () => {
    httpRequestSpy.mockResolvedValueOnce({
      data: {
        results: [],
        continuation_token: null
      }
    })

    const onProgress = vi.fn()
    const results = await service.deleteRecursiveBucketFolder('bucket-name', 'empty/', onProgress)

    expect(results).toEqual([])
    expect(onProgress).not.toHaveBeenCalled()
    expect(httpRequestSpy).toHaveBeenCalledTimes(1)
  })

  it('keeps processing when one delete fails', async () => {
    httpRequestSpy
      .mockResolvedValueOnce({
        data: {
          results: [
            { key: 'folder/good.txt', is_folder: false },
            { key: 'folder/bad.txt', is_folder: false }
          ],
          continuation_token: null
        }
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Permission denied'))

    const results = await service.deleteRecursiveBucketFolder('bucket-name', 'folder/', vi.fn())

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(false)
    expect(results[1].error.message).toBe('Permission denied')
  })
})
