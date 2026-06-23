import { BaseService } from '@/services/v2/base/query/baseService'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

/**
 * Factory producing a generic CRUDL service for a versioned sub-resource.
 * All endpoints are scoped to a parent resource + version:
 *   `{baseURL}/{appId}/versions/{versionId}/{path}`
 * `baseURL` defaults to Edge Applications; other resources (e.g. WAF) override it.
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
 * @param {string} [args.baseURL]       Parent resource base path (defaults to Edge Applications).
 * @returns {VersionedSubResourceService}
 */
export const createVersionedSubResourceService = ({
  path,
  adapter,
  queryKeyGroup,
  baseURL = 'v4/workspace/applications',
  idKey = 'id',
  createdMessage = 'Created successfully',
  updatedMessage = 'Updated successfully'
}) => {
  class VersionedSubResourceService extends BaseService {
    constructor() {
      super()
      this.baseURL = baseURL
      this.path = path
      this.adapter = adapter
      this.queryKeyGroup = queryKeyGroup
      this.idKey = idKey
      this.createdMessage = createdMessage
      this.updatedMessage = updatedMessage
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

      // Normalize to the same shape the non-versioned siblings return, so the
      // shared CreateDrawerBlock gets its success toast (`feedback`) and the new
      // id (under the resource's `idKey`, e.g. `cacheId`).
      return { [this.idKey]: data?.data?.id ?? data?.id, feedback: this.createdMessage }
    }

    edit = async (appId, versionId, payload) => {
      const body =
        this.adapter?.editPayload?.(payload) ?? this.adapter?.requestPayload?.(payload) ?? payload

      await this.http.request({
        method: 'PUT',
        url: this.getUrl(appId, versionId, `/${payload.id}`),
        body
      })

      this.queryClient.removeQueries({
        queryKey: this.queryKeyGroup.all(appId, versionId)
      })

      // Non-versioned siblings resolve edit with the success message string.
      return this.updatedMessage
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
