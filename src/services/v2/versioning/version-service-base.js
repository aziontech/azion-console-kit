import { toValue } from 'vue'
import { BaseService } from '@/services/v2/base/query/baseService'
import { versionListCachePolicy } from './version-cache-policy'

// Shared base for resource version services: lifecycle endpoints under
// `/{baseURL}/{resourceId}/versions` + cache invalidation. Subclasses set
// `adapter`, `baseURL` and `versionKeys` (the queryKeys.<resource>.version group).
export class VersionServiceBase extends BaseService {
  getUrl(resourceId, versionId, suffix = '') {
    const base = `${this.baseURL}/${resourceId}/versions`
    if (!versionId) return `${base}${suffix}`
    return `${base}/${versionId}${suffix}`
  }

  // Overridable invalidation hook called by every mutation. Default removes the
  // version cache; subclasses may extend it (e.g. also invalidating the resource
  // detail). Protected by convention.
  invalidateAfterMutation(resourceId) {
    this.queryClient.removeQueries({ queryKey: this.versionKeys.all(resourceId) })
  }

  // Splits caller `params` into the control flag and the request/key params, so
  // `skipCache` never leaks into the HTTP query string nor the cache key.
  #splitListParams = (params) => {
    const { skipCache, ...rest } = params ?? {}
    const hasParams = Object.keys(rest).length > 0
    return { skipCache: Boolean(skipCache), listParams: hasParams ? rest : undefined }
  }

  #fetchList = async (resourceId, listParams) => {
    const request = { method: 'GET', url: this.getUrl(resourceId) }
    if (listParams) request.params = listParams
    const { data } = await this.http.request(request)
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

  // `params` flow into the queryKey and the fetch; `skipCache` disables persist.
  // Default (no params) keeps the previous behavior unchanged.
  useListVersionsQuery = (resourceId, params) => {
    const { skipCache, listParams } = this.#splitListParams(params)
    return this.useQuery(
      this.versionKeys.list(toValue(resourceId), listParams),
      () => this.#fetchList(toValue(resourceId), listParams),
      { persist: !skipCache, enabled: true, skipCache, ...versionListCachePolicy() }
    )
  }

  // Async, cache-aware list reusable by callers that react to `resourceId`
  // changes (e.g. watchers). Returns the adapted array (same shape as
  // `useListVersionsQuery`'s `.data.body`).
  async listVersions(resourceId, params) {
    const id = toValue(resourceId)
    const { skipCache, listParams } = this.#splitListParams(params)
    const result = await this.useEnsureQueryData(
      this.versionKeys.list(id, listParams),
      () => this.#fetchList(id, listParams),
      { persist: !skipCache, skipCache }
    )
    return result?.body ?? []
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
