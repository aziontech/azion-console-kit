import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeStorageAdapter } from './edge-storage-adapter'

export class EdgeStorageService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeStorageAdapter
    this.baseURL = 'v4/edge_storage/buckets'
  }

  listEdgeStorageBuckets = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        pageSize: 100,
        ...params
      }
    })

    return this.adapter?.transformListEdgeStorageBuckets?.(data, params)
  }

  createEdgeStorageBucket = async (bucket = {}) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: bucket
    })

    return data
  }

  listEdgeStorageBucketFiles = async (bucketName = '') => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${bucketName}/objects`
    })

    return this.adapter?.transformListEdgeStorageFiles?.(data)
  }

  updateEdgeStorageBucket = async (bucket = {}) => {
    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${bucket.name}`,
      body: { edge_access: bucket.edge_access }
    })

    return `Bucket "${bucket.name}" has been updated successfully`
  }

  deleteEdgeStorageBucket = async (bucketName = '') => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${bucketName}`
    })

    return `Bucket "${bucketName}" has been deleted successfully`
  }

  addEdgeStorageBucketFiles = async (file = {}, bucketName = '', onProgress = null) => {
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
      url: `${this.baseURL}/${bucketName}/objects/${
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
      url: `${this.baseURL}/${bucketName}/objects/${fileName}`
    })
    return `File "${fileName}" has been deleted successfully`
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
}
export const edgeStorageService = new EdgeStorageService()
