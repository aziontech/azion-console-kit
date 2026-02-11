import { BaseService } from '@/services/v2/base/query/baseService'
import { CustomPageAdapter } from './custom-page-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class CustomPageService extends BaseService {
  constructor() {
    super()
    this.adapter = CustomPageAdapter
    this.baseURL = 'v4/workspace/custom_pages'
  }

  #fetchCustomPages = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { count, results } = data
    const body = this.adapter?.transformListCustomPage?.(results, params.fields) ?? results
    return {
      body,
      count
    }
  }

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      fields: ['id', 'name', 'last_editor', 'last_modified', 'active'],
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.customPages.list(defaultParams), () =>
      this.#fetchCustomPages(defaultParams)
    )
  }

  listCustomPagesService = async (params = { pageSize: 10 }) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.customPages.list(params),
      () => this.#fetchCustomPages(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  createCustomPagesService = async (payload) => {
    const body = this.adapter?.transformPayloadCreateCustomPage?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.customPages.all })

    return data
  }

  editCustomPagesService = async (payload) => {
    const body = this.adapter?.transformPayloadCreateCustomPage?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.customPages.all })

    return 'Your Custom Page has been updated!'
  }

  loadCustomPagesService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadCustomPage?.(data) ?? data.data
  }

  deleteCustomPagesService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.customPages.all })

    return 'Custom Page successfully deleted!'
  }
}

export const customPageService = new CustomPageService()
