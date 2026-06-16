import { toValue } from 'vue'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeAppVersionAdapter } from './edge-app-version-adapter'

/**
 * Service for Application Versions and their lifecycle actions.
 *
 * Endpoints under `/v4/workspace/applications/{resourceId}/versions`.
 * Mutations invalidate the cache via
 * `queryClient.removeQueries(queryKeys.application.version.all(rid))`,
 * removing the need for shell-side invalidation.
 */
export class EdgeAppVersionService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeAppVersionAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  getUrl(resourceId, versionId, suffix = '') {
    const base = `${this.baseURL}/${resourceId}/versions`
    if (!versionId) return `${base}${suffix}`
    return `${base}/${versionId}${suffix}`
  }

  #fetchList = async (resourceId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(resourceId)
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

  loadVersion = async (resourceId, versionId) => {
    return await this.queryClient.ensureQueryData({
      queryKey: queryKeys.application.version.detail(resourceId, versionId),
      queryFn: () => this.#fetchOne(resourceId, versionId)
    })
  }

  useListVersionsQuery = (resourceId) =>
    this.useQuery(
      queryKeys.application.version.list(resourceId),
      () => this.#fetchList(resourceId),
      { persist: false, enabled: true }
    )

  /**
   * Loads a single version's detail. Accepts plain values OR reactive sources
   * (refs/getters) for `resourceId`/`versionId`: when reactive, the query key
   * embeds them so vue-query refetches on an in-place version switch (e.g.
   * post-`NEW_DRAFT_FROM`) instead of serving the original version's cache. The
   * fetcher unwraps via `toValue`, so plain strings keep the previous behavior.
   */
  useLoadVersionQuery = (resourceId, versionId) =>
    this.useQuery(
      queryKeys.application.version.detail(resourceId, versionId),
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

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.all(resourceId)
    })

    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  updateDraft = async (resourceId, versionId, values = {}) => {
    const payload = this.adapter?.transformDraftPayload?.(values) ?? values

    const { data } = await this.http.request({
      method: 'PUT',
      url: this.getUrl(resourceId, versionId),
      body: payload
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.all(resourceId)
    })

    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  patchDraft = async (resourceId, versionId, partial = {}) => {
    const payload = this.adapter?.transformDraftPayload?.(partial) ?? partial

    const { data } = await this.http.request({
      method: 'PATCH',
      url: this.getUrl(resourceId, versionId),
      body: payload
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.all(resourceId)
    })

    return this.adapter?.transformLoadVersion?.(data) ?? data
  }

  deleteVersion = async (resourceId, versionId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(resourceId, versionId)
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.all(resourceId)
    })
  }

  build = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformBuildPayload?.(body) ?? body

    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/build'),
      body: payload
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.all(resourceId)
    })
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

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.all(resourceId)
    })
  }

  cancelBuild = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformBuildPayload?.(body) ?? body

    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/cancel'),
      body: payload
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.all(resourceId)
    })
  }
}

export const edgeAppVersionService = new EdgeAppVersionService()
