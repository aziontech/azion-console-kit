import { toValue } from 'vue'
import { BaseService } from '@/services/v2/base/query/baseService'

// Shared base for resource version services: lifecycle endpoints under
// `/{baseURL}/{resourceId}/versions` + cache invalidation. Subclasses set
// `adapter`, `baseURL` and `versionKeys` (the queryKeys.<resource>.version group).
export class VersionServiceBase extends BaseService {
  getUrl(resourceId, versionId, suffix = '') {
    const base = `${this.baseURL}/${resourceId}/versions`
    if (!versionId) return `${base}${suffix}`
    return `${base}/${versionId}${suffix}`
  }

  #invalidate = (resourceId) =>
    this.queryClient.removeQueries({ queryKey: this.versionKeys.all(resourceId) })

  #fetchList = async (resourceId) => {
    const { data } = await this.http.request({ method: 'GET', url: this.getUrl(resourceId) })
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

  useListVersionsQuery = (resourceId) =>
    this.useQuery(
      this.versionKeys.list(toValue(resourceId)),
      () => this.#fetchList(toValue(resourceId)),
      { persist: false, enabled: true }
    )

  // Async, cache-aware list reusable by callers that react to `resourceId`
  // changes (e.g. watchers). Returns the adapted array (same shape as
  // `useListVersionsQuery`'s `.data.body`).
  async listVersions(resourceId) {
    const id = toValue(resourceId)
    const result = await this.useEnsureQueryData(
      this.versionKeys.list(id),
      () => this.#fetchList(id),
      { persist: false }
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
    this.#invalidate(resourceId)
    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  updateDraft = async (resourceId, versionId, values = {}) => {
    const payload = this.adapter?.transformDraftPayload?.(values) ?? values
    const { data } = await this.http.request({
      method: 'PUT',
      url: this.getUrl(resourceId, versionId),
      body: payload
    })
    this.#invalidate(resourceId)
    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  patchDraft = async (resourceId, versionId, partial = {}) => {
    const payload = this.adapter?.transformDraftPayload?.(partial) ?? partial
    const { data } = await this.http.request({
      method: 'PATCH',
      url: this.getUrl(resourceId, versionId),
      body: payload
    })
    this.#invalidate(resourceId)
    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  deleteVersion = async (resourceId, versionId) => {
    await this.http.request({ method: 'DELETE', url: this.getUrl(resourceId, versionId) })
    this.#invalidate(resourceId)
  }

  build = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformBuildPayload?.(body) ?? body
    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/build'),
      body: payload
    })
    this.#invalidate(resourceId)
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
    this.#invalidate(resourceId)
  }

  cancelBuild = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformBuildPayload?.(body) ?? body
    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/cancel'),
      body: payload
    })
    this.#invalidate(resourceId)
  }
}
