import { BaseService } from '@/services/v2/base/query/baseService'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

/**
 * Factory producing a generic CRUDL service for a versioned Edge Application
 * sub-resource. All endpoints are scoped to an application + version:
 *   `v4/workspace/applications/{appId}/versions/{versionId}/{path}`
 *
 * The optional `adapter` is called via generic, normalized method names so the
 * factory stays resource-agnostic; every call is optional-chained and falls back
 * to the raw value when the method (or the adapter) is absent:
 *   - `transformList(results)` / `transformLoad(data)` → shape GET responses.
 *   - `requestPayload(payload)` → POST body; `editPayload(payload)` → PUT body
 *     (falls back to `requestPayload`, e.g. functions force `active` on create
 *     but not on edit).
 *
 * @param {Object}  args
 * @param {string}  args.path           Snake_case API path segment (e.g. 'cache_settings').
 * @param {Object} [args.adapter]       Adapter exposing the generic methods above.
 * @param {Object}  args.queryKeyGroup  Versioned query-key group: `all`/`list`/`detail`(appId, versionId, ...).
 * @returns {VersionedSubResourceService}
 */
export const createVersionedSubResourceService = ({ path, adapter, queryKeyGroup }) => {
  class VersionedSubResourceService extends BaseService {
    constructor() {
      super()
      this.baseURL = 'v4/workspace/applications'
      this.path = path
      this.adapter = adapter
      this.queryKeyGroup = queryKeyGroup
    }

    getUrl(appId, versionId, suffix = '') {
      return `${this.baseURL}/${appId}/versions/${versionId}/${this.path}${suffix}`
    }

    #fetchList = async (appId, versionId, params) => {
      const { data } = await this.http.request({
        method: 'GET',
        url: this.getUrl(appId, versionId),
        params
      })

      const { results, count } = data
      const body = this.adapter?.transformList?.(results) ?? results

      return { count, body }
    }

    list = async (appId, versionId, params = {}) => {
      await waitForPersistenceRestore()

      const skipCache = params?.hasFilter || params?.skipCache || params?.search

      return await this.useEnsureQueryData(
        this.queryKeyGroup.list(appId, versionId, params),
        () => this.#fetchList(appId, versionId, params),
        { persist: false, skipCache }
      )
    }

    #fetchOne = async (appId, versionId, id) => {
      const { data } = await this.http.request({
        method: 'GET',
        url: this.getUrl(appId, versionId, `/${id}`)
      })

      return this.adapter?.transformLoad?.(data) ?? data
    }

    load = async (appId, versionId, id) => {
      await waitForPersistenceRestore()

      return await this.useEnsureQueryData(
        this.queryKeyGroup.detail(appId, versionId, id),
        () => this.#fetchOne(appId, versionId, id),
        { persist: false }
      )
    }

    create = async (appId, versionId, payload) => {
      const body = this.adapter?.requestPayload?.(payload) ?? payload

      const { data } = await this.http.request({
        method: 'POST',
        url: this.getUrl(appId, versionId),
        body
      })

      this.queryClient.removeQueries({
        queryKey: this.queryKeyGroup.all(appId, versionId)
      })

      return data
    }

    edit = async (appId, versionId, payload) => {
      const body =
        this.adapter?.editPayload?.(payload) ?? this.adapter?.requestPayload?.(payload) ?? payload

      const { data } = await this.http.request({
        method: 'PUT',
        url: this.getUrl(appId, versionId, `/${payload.id}`),
        body
      })

      this.queryClient.removeQueries({
        queryKey: this.queryKeyGroup.all(appId, versionId)
      })

      return data
    }

    remove = async (appId, versionId, id) => {
      await this.http.request({
        method: 'DELETE',
        url: this.getUrl(appId, versionId, `/${id}`)
      })

      this.queryClient.removeQueries({
        queryKey: this.queryKeyGroup.all(appId, versionId)
      })
    }
  }

  return new VersionedSubResourceService()
}
