import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeStorageAdapter } from './edge-storage-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const DEFAULT_CREDENTIALS_PARAMS = {
  page: 1,
  pageSize: 10,
  fields: [],
  ordering: '-last_modified'
}

export class EdgeStorageService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeStorageAdapter
    this.baseURL = 'v4/workspace/storage'
  }

  #fetchBucketsList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/buckets`,
      params: {
        search: '',
        fields: '',
        ordering: '-last_modified',
        page: 1,
        pageSize: 10,
        ...params
      }
    })

    return this.adapter?.transformListEdgeStorageBuckets?.(data, params)
  }

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      ordering: '-last_modified',
      fields: ['name', 'size', 'last_editor', 'last_modified', 'workloads_access']
    }
    return this.usePrefetchQuery(queryKeys.edgeStorage.buckets.list(defaultParams), () =>
      this.#fetchBucketsList(defaultParams)
    )
  }

  listEdgeStorageBuckets = async (params = {}) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeStorage.buckets.list(params),
      () => this.#fetchBucketsList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  createEdgeStorageBucket = async (bucket = {}) => {
    const body = this.adapter?.transformCreateStorageBucket?.(bucket)
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/buckets`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeStorage.buckets.all() })

    return data
  }

  listEdgeStorageBucketFiles = async (
    bucketName = '',
    all_levels = false,
    prefix = '',
    continuation_token = ''
  ) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/buckets/${bucketName}/objects`,
      params: {
        all_levels,
        prefix,
        max_object_count: 110,
        continuation_token
      }
    })

    return this.adapter?.transformListEdgeStorageFiles?.(data)
  }

  updateEdgeStorageBucket = async (bucket = {}) => {
    const { data } = await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/buckets/${bucket?.name}`,
      body: { workloads_access: bucket.workloads_access }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeStorage.buckets.all() })

    return data
  }

  deleteEdgeStorageBucket = async (bucketName = '') => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/buckets/${bucketName}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeStorage.buckets.all() })

    return `Bucket "${bucketName}" has been deleted successfully`
  }

  addEdgeStorageBucketFiles = async (
    file = {},
    bucketName = '',
    onProgress = null,
    prefix = '',
    signal = null
  ) => {
    const config = {}

    if (onProgress && typeof onProgress === 'function') {
      config.onUploadProgress = (progressEvent) => {
        const progress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: progressEvent.total
            ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
            : 0,
          fileName: file.name,
          fileSize: file.size
        }
        onProgress(progress)
      }
    }

    if (signal) {
      config.signal = signal
    }

    await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/buckets/${bucketName}/objects/${encodeURIComponent(prefix)}${
        file.webkitRelativePath ? file.webkitRelativePath : file.name
      }`,
      body: file,
      config
    })
    return 'File added successfully'
  }

  copyEdgeStorageBucketFile = async (bucketName = '', objectKey = '', newObjectKey = '') => {
    await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/buckets/${bucketName}/objects/${encodeURIComponent(objectKey)}/copy/${encodeURIComponent(newObjectKey)}`,
      body: {}
    })
    return `File "${objectKey}" copied to "${newObjectKey}" successfully`
  }

  moveEdgeStorageBucketFiles = async (
    bucketName = '',
    files = [],
    destinationPrefix = '',
    onProgress = null
  ) => {
    const results = []
    const totalFiles = files.length
    const totalSteps = totalFiles * 2

    for (let idx = 0; idx < totalFiles; idx++) {
      const file = files[idx]
      const sourceKey = file.fullPath
      const destKey = destinationPrefix + file.name

      if (onProgress && typeof onProgress === 'function') {
        onProgress({
          fileName: file.name,
          completed: idx,
          total: totalFiles,
          percentage: Math.round(((idx * 2) / totalSteps) * 100),
          step: 'copying'
        })
      }

      try {
        await this.copyEdgeStorageBucketFile(bucketName, sourceKey, destKey)

        if (onProgress && typeof onProgress === 'function') {
          onProgress({
            fileName: file.name,
            completed: idx,
            total: totalFiles,
            percentage: Math.round(((idx * 2 + 1) / totalSteps) * 100),
            step: 'deleting'
          })
        }

        await this.deleteEdgeStorageBucketFiles(bucketName, sourceKey)

        if (onProgress && typeof onProgress === 'function') {
          onProgress({
            fileName: file.name,
            completed: idx + 1,
            total: totalFiles,
            percentage: Math.round(((idx * 2 + 2) / totalSteps) * 100),
            step: 'done'
          })
        }

        results.push({
          fileName: file.name,
          success: true,
          message: `File "${file.name}" moved successfully`
        })
      } catch (error) {
        results.push({
          fileName: file.name,
          success: false,
          error,
          message: `Failed to move file "${file.name}"`
        })
      }
    }

    return results
  }

  renameEdgeStorageBucketFile = async (
    bucketName = '',
    currentObjectKey = '',
    newObjectKey = ''
  ) => {
    await this.copyEdgeStorageBucketFile(bucketName, currentObjectKey, newObjectKey)

    try {
      await this.deleteEdgeStorageBucketFiles(bucketName, currentObjectKey)
    } catch (deleteError) {
      try {
        await this.deleteEdgeStorageBucketFiles(bucketName, newObjectKey)
      } catch {
        // rollback cleanup failed — both files now exist
      }
      throw deleteError
    }

    return `File renamed from "${currentObjectKey}" to "${newObjectKey}" successfully`
  }

  deleteEdgeStorageBucketFiles = async (bucketName = '', fileName = '') => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/buckets/${bucketName}/objects/${fileName}`
    })
    return `File "${fileName}" has been deleted successfully`
  }

  deleteMultipleEdgeStorageBucketFiles = async (
    bucketName = '',
    fileNames = [],
    onProgress = null
  ) => {
    const results = []
    const totalFiles = fileNames.length

    for (let aux = 0; aux < fileNames.length; aux++) {
      const fileName = fileNames[aux]

      if (onProgress && typeof onProgress === 'function') {
        const progress = {
          fileName: fileName,
          completed: aux + 1,
          total: totalFiles,
          percentage: Math.round(((aux + 1) / totalFiles) * 100)
        }
        onProgress(progress)
      }

      try {
        await this.http.request({
          method: 'DELETE',
          url: `${this.baseURL}/buckets/${bucketName}/objects/${fileName}`
        })

        results.push({
          fileName,
          success: true,
          message: `File "${fileName}" has been deleted successfully`
        })
      } catch (error) {
        results.push({
          fileName,
          success: false,
          error: error,
          message: `Failed to delete file "${fileName}"`
        })
      }
    }

    return results
  }

  downloadEdgeStorageBucketFiles = async (bucketName = '', fileName = '') => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/buckets/${bucketName}/objects/${fileName}`,
      config: {
        responseType: 'blob'
      }
    })

    return response.data
  }

  getEdgeStorageMetrics = async () => {
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    const tsLt = now.toISOString()
    const tsGte = twoDaysAgo.toISOString()

    const query = `
      query {
        edgeStorageMetrics(
          filter: {
            tsGte: "${tsGte}"
            tsLt: "${tsLt}"
          },
          limit: 1000,
          offset: 0
        ) {
          bucketName
          storedGb
        }
      }
    `

    const { data } = await this.http.request({
      method: 'POST',
      url: 'v4/metrics/graphql',
      body: {
        query
      }
    })

    return data.data.edgeStorageMetrics
  }

  #fetchCredentials = async (bucketName, params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/credentials`,
      params: {
        buckets: bucketName,
        ...params
      }
    })
    return this.adapter?.transformListEdgeStorageCredentials?.(data)
  }

  prefetchCredentials = (bucketName, pageSize = 10) => {
    const params = {
      ...DEFAULT_CREDENTIALS_PARAMS,
      pageSize
    }
    return this.usePrefetchQuery(queryKeys.edgeStorage.credentials.list(bucketName, params), () =>
      this.#fetchCredentials(bucketName, params)
    )
  }

  listCredentials = async (bucketName, params = {}) => {
    const mergedParams = { ...DEFAULT_CREDENTIALS_PARAMS, ...params }
    const firstPage = mergedParams.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeStorage.credentials.list(bucketName, mergedParams),
      () => this.#fetchCredentials(bucketName, mergedParams),
      { persist: firstPage && !skipCache, skipCache }
    )
  }
  createCredential = async (credential = {}) => {
    const body = this.adapter?.transformCreateEdgeStorageCredential?.(credential)
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/credentials`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeStorage.credentials.all() })

    return data
  }
  deleteCredential = async (credentialId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/credentials/${credentialId}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeStorage.credentials.all() })
  }
}
export const edgeStorageService = new EdgeStorageService()
