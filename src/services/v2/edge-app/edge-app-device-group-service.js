import { BaseService } from '@/services/v2/base/query/baseService'
import { DeviceGroupAdapter } from './edge-app-device-group-adapter'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

export const deviceGroupsKeys = {
  all: (edgeAppId) => {
    if (!edgeAppId) {
      // eslint-disable-next-line no-console
      console.warn('[deviceGroupsKeys] Invalid edgeAppId provided:', edgeAppId)
      return ['device-groups', '__invalid_edge_app_id__']
    }
    return ['device-groups', edgeAppId]
  },
  lists: (edgeAppId) => [...deviceGroupsKeys.all(edgeAppId), 'list'],
  details: (edgeAppId) => [...deviceGroupsKeys.all(edgeAppId), 'detail']
}

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

    const queryKey = [...deviceGroupsKeys.lists(edgeApplicationId), params]
    const hasFilter = params?.hasFilter || false

    return await this._ensureQueryData(
      () => queryKey,
      () => this.#fetchList(edgeApplicationId, params),
      { persist: params.page === 1 && !params.search && !hasFilter, skipCache: hasFilter }
    )
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
      queryKey: deviceGroupsKeys.details(edgeApplicationId)
    })

    const hasDifferentId = cachedQueries.some(([key]) => {
      const cachedId = key[key.length - 1]
      return cachedId && cachedId !== deviceGroupId
    })

    if (hasDifferentId) {
      await this.queryClient.removeQueries({
        queryKey: deviceGroupsKeys.details(edgeApplicationId)
      })
    }

    await waitForPersistenceRestore()

    return await this._ensureQueryData(
      () => [...deviceGroupsKeys.details(edgeApplicationId), deviceGroupId],
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
    this.queryClient.removeQueries({ queryKey: deviceGroupsKeys.all(edgeApplicationId) })

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
    this.queryClient.removeQueries({ queryKey: deviceGroupsKeys.all(edgeApplicationId) })
    this.queryClient.removeQueries({ queryKey: deviceGroupsKeys.details(edgeApplicationId) })

    return 'Device Group successfully updated'
  }

  deleteDeviceGroupService = async (edgeApplicationId, deviceGroupId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${deviceGroupId}`)
    })

    // Remove list queries from cache (including IndexedDB) after deleting
    this.queryClient.removeQueries({ queryKey: deviceGroupsKeys.all(edgeApplicationId) })

    return 'Device Group successfully deleted'
  }
}

export const deviceGroupService = new DeviceGroupService()
