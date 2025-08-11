export class EdgeStorageService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
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

    return this.adapter?.transformCreateEdgeStorageBucket?.(data)
  }

  listEdgeStorageBucketFiles = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${params.bucketName}/objects`,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        pageSize: 100,
        ...params
      }
    })

    return this.adapter?.transformListEdgeStorageBucketFiles?.(data, params)
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
      url: `${this.baseURL}/${bucketName}/objects/${file.name}`,
      body: file,
      config
    })
    return 'File added successfully'
  }
}
