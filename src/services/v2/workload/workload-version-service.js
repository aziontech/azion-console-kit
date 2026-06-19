import { toValue } from 'vue'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { WorkloadVersionAdapter } from './workload-version-adapter'

export class WorkloadVersionService extends BaseService {
  constructor() {
    super()
    this.adapter = WorkloadVersionAdapter
    this.baseURL = 'v4/workspace/workloads'
  }

  getUrl(resourceId, versionId, suffix = '') {
    const base = `${this.baseURL}/${resourceId}/versions`
    if (!versionId) return `${base}${suffix}`
    return `${base}/${versionId}${suffix}`
  }

  #invalidate = (resourceId) =>
    this.queryClient.removeQueries({
      queryKey: queryKeys.workload.version.all(resourceId)
    })

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

  useListVersionsQuery = (resourceId) =>
    this.useQuery(
      queryKeys.workload.version.list(toValue(resourceId)),
      () => this.#fetchList(toValue(resourceId)),
      { persist: false, enabled: true }
    )

  loadVersion = async (resourceId, versionId) =>
    this.useEnsureQueryData(
      queryKeys.workload.version.detail(toValue(resourceId), toValue(versionId)),
      () => this.#fetchOne(toValue(resourceId), toValue(versionId)),
      { persist: false }
    )

  useLoadVersionQuery = (resourceId, versionId) =>
    this.useQuery(
      queryKeys.workload.version.detail(toValue(resourceId), toValue(versionId)),
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

  // Save Draft (PUT). Workloads run save-and-build automatically on PUT/POST of
  // the resource (doc §3), so there is NO separate `build` endpoint: this is both
  // SAVE and SAVE_AND_BUILD at the service layer.
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

  cancelBuild = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformActionPayload?.(body) ?? body

    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/cancel'),
      body: payload
    })

    this.#invalidate(resourceId)
  }

  archive = async (resourceId, versionId, body = {}) => {
    if (!body || typeof body.comment !== 'string' || body.comment.trim() === '') {
      throw new Error('A non-empty `comment` is required to archive a version')
    }
    const payload = this.adapter?.transformActionPayload?.(body) ?? body

    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/archive'),
      body: payload
    })

    this.#invalidate(resourceId)
  }

  rollback = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformActionPayload?.(body) ?? body

    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/rollback'),
      body: payload
    })

    this.#invalidate(resourceId)
  }

  deleteVersion = async (resourceId, versionId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(resourceId, versionId)
    })

    this.#invalidate(resourceId)
  }
}

export const workloadVersionService = new WorkloadVersionService()
