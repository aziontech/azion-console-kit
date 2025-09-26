import { BaseService } from '@/services/v2/base/query/baseService'
import { KnowledgeBaseAdapter } from './knowledge-base-adapter'

export class KnowledgeBaseService extends BaseService {
  constructor() {
    super()
    this.adapter = KnowledgeBaseAdapter
    this.baseURL = 'v4/workspace/ai/kb'
  }

  #getUrl(id, suffix = '') {
    if (!id) {
      return `${this.baseURL}${suffix}`
    }
    return `${this.baseURL}/${id}${suffix}`
  }

  listKnowledgeBaseService = async (params = { pageSize: 100, fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(),
      params
    })

    const { results, count } = data

    const transformed = this.adapter?.transformListKnowledgeBase?.(results) ?? results

    return {
      count,
      body: transformed
    }
  }

  loadKnowledgeBaseService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(id)
    })

    return this.adapter?.transformLoadKnowledgeBase?.(data.data, []) ?? data.data
  }

  createKnowledgeBaseService = async (payload) => {
    const body = this.adapter?.transformPayloadKnowledgeBase?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    return {
      feedback: 'Your knowledge base has been created',
      urlToEditView: `/ai/knowledge-base/edit/${data.data.kb_id}`,
      uuid: data.data.kb_id
    }
  }

  editKnowledgeBaseService = async (payload) => {
    const body = this.adapter?.transformPayloadKnowledgeBase?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.id),
      body
    })

    return 'Your knowledge base has been updated'
  }

  deleteKnowledgeBaseService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(id)
    })

    return 'Knowledge base successfully deleted'
  }
}

export const knowledgeBaseService = new KnowledgeBaseService()