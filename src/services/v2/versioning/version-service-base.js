import { toValue } from 'vue'
import { BaseService } from '@/services/v2/base/query/baseService'
import { versionListCachePolicy } from './version-cache-policy'

export const VERSION_LIST_MAX_PAGE_SIZE = 100
export const VERSION_LIST_DEFAULT_PAGE_SIZE = 20

const CACHE_CONTROL_KEYS = ['skipCache', 'hasFilter']

export const buildVersionListParams = (params = {}) => {
  const { page, pageSize, page_size, ...rest } = params ?? {}

  const passthrough = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !CACHE_CONTROL_KEYS.includes(key))
  )

  const requestedPage = Number(page)
  const requestedPageSize = Number(pageSize ?? page_size)

  return {
    ...passthrough,
    page: requestedPage > 0 ? requestedPage : 1,
    page_size:
      requestedPageSize > 0
        ? Math.min(requestedPageSize, VERSION_LIST_MAX_PAGE_SIZE)
        : VERSION_LIST_DEFAULT_PAGE_SIZE
  }
}

export class VersionServiceBase extends BaseService {
  getUrl(resourceId, versionId, suffix = '') {
    const base = `${this.baseURL}/${resourceId}/versions`
    if (!versionId) return `${base}${suffix}`
    return `${base}/${versionId}${suffix}`
  }

  invalidateAfterMutation(resourceId) {
    this.queryClient.removeQueries({ queryKey: this.versionKeys.all(resourceId) })
  }

  #splitListParams = (params) => {
    const { skipCache, ...rest } = params ?? {}
    return { skipCache: Boolean(skipCache), listParams: buildVersionListParams(rest) }
  }

  #fetchList = async (resourceId, listParams) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(resourceId),
      params: listParams
    })
    return this.adapter?.transformListVersions?.(data) ?? data
  }

  #fetchOne = async (resourceId, versionId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(resourceId, versionId)
    })
    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  loadVersion = (resourceId, versionId) =>
    this.useEnsureQueryData(
      this.versionKeys.detail(toValue(resourceId), toValue(versionId)),
      () => this.#fetchOne(toValue(resourceId), toValue(versionId)),
      { persist: false }
    )

  useListVersionsQuery = (resourceId, params) => {
    const { skipCache, listParams } = this.#splitListParams(params)
    return this.useQuery(
      this.versionKeys.list(toValue(resourceId), listParams),
      () => this.#fetchList(toValue(resourceId), listParams),
      { persist: !skipCache, enabled: true, skipCache, ...versionListCachePolicy() }
    )
  }

  listVersionsPage = async (resourceId, params) => {
    const id = toValue(resourceId)
    const { skipCache, listParams } = this.#splitListParams(params)
    const result = await this.useEnsureQueryData(
      this.versionKeys.list(id, listParams),
      () => this.#fetchList(id, listParams),
      { persist: !skipCache, skipCache }
    )
    return { body: result?.body ?? [], count: result?.count ?? 0 }
  }

  async listVersions(resourceId, params) {
    const { body } = await this.listVersionsPage(resourceId, params)
    return body
  }

  useLoadVersionQuery = (resourceId, versionId) =>
    this.useQuery(
      this.versionKeys.detail(toValue(resourceId), toValue(versionId)),
      () => this.#fetchOne(toValue(resourceId), toValue(versionId)),
      { persist: false, enabled: true }
    )

  createDraft = async (resourceId, body = {}) => {
    const payload = this.adapter?.transformCreateDraftPayload?.(body) ?? body
    const { data } = await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId),
      body: payload
    })
    this.invalidateAfterMutation(resourceId)
    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  updateDraft = async (resourceId, versionId, values = {}) => {
    const payload = this.adapter?.transformDraftPayload?.(values) ?? values
    const { data } = await this.http.request({
      method: 'PATCH',
      url: this.getUrl(resourceId, versionId),
      body: payload
    })
    this.invalidateAfterMutation(resourceId)
    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  patchDraft = async (resourceId, versionId, partial = {}) => {
    const payload = this.adapter?.transformDraftPayload?.(partial) ?? partial
    const { data } = await this.http.request({
      method: 'PATCH',
      url: this.getUrl(resourceId, versionId),
      body: payload
    })
    this.invalidateAfterMutation(resourceId)
    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  deleteVersion = async (resourceId, versionId) => {
    await this.http.request({ method: 'DELETE', url: this.getUrl(resourceId, versionId) })
    this.invalidateAfterMutation(resourceId)
  }

  build = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformBuildPayload?.(body) ?? body
    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/build'),
      body: payload
    })
    this.invalidateAfterMutation(resourceId)
  }

  archive = async (resourceId, versionId, body = {}) => {
    if (!body || typeof body.comment !== 'string' || body.comment.trim() === '') {
      throw new Error('A non-empty `comment` is required to archive a version')
    }
    const payload = this.adapter?.transformArchivePayload?.(body) ?? body
    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/archive'),
      body: payload
    })
    this.invalidateAfterMutation(resourceId)
  }

  cancelBuild = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformBuildPayload?.(body) ?? body
    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/cancel'),
      body: payload
    })
    this.invalidateAfterMutation(resourceId)
  }
}
