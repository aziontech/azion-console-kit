import { BaseService } from '@/services/v2/base/query/baseService'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

/**
 * @param {Object} args
 * @param {string} args.path
 * @param {Object} [args.adapter]
 * @param {Object} args.queryKeyGroup
 * @param {string} [args.baseURL]
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
