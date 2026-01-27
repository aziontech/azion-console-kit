import { BaseService } from '@/services/v2/base/query/baseService'
import { DeviceGroupAdapter } from './edge-app-device-group-adapter'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class DeviceGroupService extends BaseService {
  constructor() {
    super()
    this.adapter = DeviceGroupAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  getUrl(edgeApplicationId, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/device_groups${suffix}`
  }

  #fetchList = async (edgeApplicationId, params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId),
      params
    })

    const { results, count } = data
    const transformed = this.adapter?.transformListDeviceGroup?.(results) ?? results

    return {
      count,
      body: transformed
    }
  }

  listDeviceGroupService = async (edgeApplicationId, params = { pageSize: 10, page: 1 }) => {
    await waitForPersistenceRestore()

    const queryKey = [...queryKeys.deviceGroups.lists(edgeApplicationId), params]
    const hasFilter = params?.hasFilter || false

    return await this._ensureQueryData(
      () => queryKey,
      () => this.#fetchList(edgeApplicationId, params),
      { persist: params.page === 1 && !params.search && !hasFilter, skipCache: hasFilter }
    )
  }

  /**
   * Prefetches the first page of device groups to warm up the cache.
   * Uses prefetch to avoid duplicate requests when the same query is called multiple times.
   * @param {string} edgeApplicationId - The edge application ID
   */
  prefetchDeviceGroupsList = async (edgeApplicationId) => {
    const defaultParams = {
      page: 1,
      pageSize: 10,
      fields: ['id', 'name', 'user_agent'],
      ordering: 'name'
    }
    return await this.listDeviceGroupService(edgeApplicationId, defaultParams)
  }

  #fetchDeviceGroup = async (edgeApplicationId, deviceGroupId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, `/${deviceGroupId}`)
    })

    return this.adapter?.transformLoadDeviceGroup?.(data) ?? data.data
  }

  loadDeviceGroupService = async (edgeApplicationId, deviceGroupId) => {
    const cachedQueries = this.queryClient.getQueriesData({
      queryKey: queryKeys.deviceGroups.details(edgeApplicationId)
    })

    const hasDifferentId = cachedQueries.some(([key]) => {
      const cachedId = key[key.length - 1]
      return cachedId && cachedId !== deviceGroupId
    })

    if (hasDifferentId) {
      await this.queryClient.removeQueries({
        queryKey: queryKeys.deviceGroups.details(edgeApplicationId)
      })
    }

    await waitForPersistenceRestore()

    return await this._ensureQueryData(
      [...queryKeys.deviceGroups.details(edgeApplicationId), deviceGroupId],
      () => this.#fetchDeviceGroup(edgeApplicationId, deviceGroupId),
      { persist: true }
    )
  }

  createDeviceGroupService = async (payload) => {
    const { edgeApplicationId } = payload

    const body = this.adapter?.transformPayload?.(payload) ?? payload

    const result = await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId),
      body
    })

    // Remove list queries from cache (including IndexedDB) after creating
    this.queryClient.removeQueries({ queryKey: queryKeys.deviceGroups.all(edgeApplicationId) })

    return {
      id: result.data.data.id,
      feedback: 'Device Group successfully created'
    }
  }

  editDeviceGroupService = async (edgeApplicationId, payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PUT',
      url: this.getUrl(edgeApplicationId, `/${payload.id}`),
      body
    })

    // Remove list and detail queries from cache (including IndexedDB) after editing
    this.queryClient.removeQueries({ queryKey: queryKeys.deviceGroups.all(edgeApplicationId) })
    this.queryClient.removeQueries({ queryKey: queryKeys.deviceGroups.details(edgeApplicationId) })

    return 'Device Group successfully updated'
  }

  deleteDeviceGroupService = async (edgeApplicationId, deviceGroupId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${deviceGroupId}`)
    })

    // Remove list queries from cache (including IndexedDB) after deleting
    this.queryClient.removeQueries({ queryKey: queryKeys.deviceGroups.all(edgeApplicationId) })

    return 'Device Group successfully deleted'
  }
}

export const deviceGroupService = new DeviceGroupService()
