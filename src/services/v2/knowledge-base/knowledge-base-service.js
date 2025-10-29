import { BaseService } from '@/services/v2/base/query/baseService'
import { KnowledgeBaseAdapter } from './knowledge-base-adapter'

export class KnowledgeBaseService extends BaseService {
  constructor() {
    super()
    this.adapter = KnowledgeBaseAdapter
    this.baseURL = '/api/v4/workspace/ai/kbs'
  }

  listKnowledgeBases = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        page_size: 100,
        ...params
      }
    })

    // API returns PaginatedKnowledgeBaseList: { count, results: KnowledgeBase[] }
    return this.adapter.transformListKnowledgeBases(response.data, params.fields)
  }

  createKnowledgeBase = async (payload = {}) => {
    const adaptedPayload = {
      name: payload?.name,
      description: payload?.description,
      embedding_model: payload?.embedding_model
    }

    const response = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: adaptedPayload
    })

    // API returns { data: { data: { ...created KB... } } }
    const actualData = response.data?.data || response.data
    return {
      feedback: 'Your Knowledge Base item has been created',
      urlToEditView: `/ai/knowledge-base/edit/${actualData.kb_id}`,
      knowledgeBaseId: actualData.kb_id,
      data: actualData
    }
  }

  loadKnowledgeBase = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    // API returns { data: { data: { ...actual data... } } }
    const actualData = response.data?.data || response.data
    return this.adapter.transformLoadKnowledgeBase(actualData)
  }

  updateKnowledgeBase = async (id, payload = {}) => {
    const adaptedPayload = {
      name: payload?.name,
      description: payload?.description,
      embedding_model: payload?.embedding_model
    }

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${id}`,
      body: adaptedPayload
    })

    return 'Knowledge Base updated successfully'
  }

  deleteKnowledgeBase = async (item) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${item.kbId}`
    })

    return 'Knowledge Base deleted successfully'
  }

  // Document-related methods
  listDocuments = async (kbId, params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${kbId}/documents`,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        page_size: 100,
        ...params
      }
    })

    // API returns { data: { data: { results: [...], count: N } } }
    const actualData = response.data?.data || response.data
    return this.adapter.transformListDocuments(actualData, params.fields)
  }

  uploadDocument = async (kbId, file, onProgress = null) => {
    const formData = new FormData()
    formData.append('file', file)

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

    const response = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${kbId}/documents`,
      body: formData,
      config: {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    })

    // API returns { data: { data: { ...uploaded document... } } }
    return response.data?.data || response.data
  }

  deleteDocument = async (kbId, documentId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${kbId}/documents/${documentId}`
    })

    return 'Document deleted successfully'
  }
}

export const knowledgeBaseService = new KnowledgeBaseService()
