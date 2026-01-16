import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeStorageAdapter } from './edge-storage-adapter'

export class EdgeStorageService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeStorageAdapter
    this.baseURL = 'v4/workspace/storage'
  }

  listEdgeStorageBuckets = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/buckets`,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        pageSize: 10,
        ...params
      }
    })

    return this.adapter?.transformListEdgeStorageBuckets?.(data, params)
  }

  createEdgeStorageBucket = async (bucket = {}) => {
    const body = this.adapter?.transformCreateEdgeStorageBucket?.(bucket)
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/buckets`,
      body
    })

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

    return data
  }

  deleteEdgeStorageBucket = async (bucketName = '') => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/buckets/${bucketName}`
    })

    return `Bucket "${bucketName}" has been deleted successfully`
  }

  addEdgeStorageBucketFiles = async (
    file = {},
    bucketName = '',
    onProgress = null,
    prefix = ''
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
      url: `${this.baseURL}/${bucketName}/objects/${fileName}`,
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
          }
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

  listCredentials = async (bucketName, params = {}) => {
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
  createCredential = async (credential = {}) => {
    const body = this.adapter?.transformCreateEdgeStorageBucket?.(credential)
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/credentials`,
      body
    })

    return data
  }
  deleteCredential = async (credentialId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/credentials/${credentialId}`
    })
  }
}
export const edgeStorageService = new EdgeStorageService()
