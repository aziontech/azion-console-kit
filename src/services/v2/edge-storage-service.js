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
}
