import { BaseService } from '@/services/v2/base/query/baseService'
import { DeviceGroupAdapter } from './edge-app-device-group-adapter'
import { TABLE_FIRST_PAGE_OPTIONS, TABLE_PAGINATION_OPTIONS } from '@/services/v2/base/query/config'

const CONSTANTS = {
  CACHE_KEY: 'device-groups-list',
  DEFAULT_PAGE_SIZE: 10,
  MESSAGES: {
    CREATE_SUCCESS: 'Device Group successfully created',
    UPDATE_SUCCESS: 'Device Group successfully updated',
    DELETE_SUCCESS: 'Device Group successfully deleted'
  }
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

  async invalidateListCache(edgeApplicationId) {
    await this.queryClient.removeQueries({
      predicate: (query) => {
        const queryKey = query.queryKey
        return (
          queryKey &&
          Array.isArray(queryKey) &&
          queryKey[0] === this.cacheType.GLOBAL &&
          queryKey.includes(CONSTANTS.CACHE_KEY) &&
          queryKey.includes(`edgeAppId=${edgeApplicationId}`)
        )
      }
    })
  }

  #getCacheOptions(params) {
    const paramValues = params || {}
    const isFirstPage = paramValues.page === 1 || !paramValues.page
    const hasSearch = paramValues.search?.trim()

    const baseOptions = isFirstPage ? TABLE_FIRST_PAGE_OPTIONS : TABLE_PAGINATION_OPTIONS
    const shouldPersist = isFirstPage && !hasSearch

    return {
      ...baseOptions,
      meta: { persist: shouldPersist }
    }
  }

  listDeviceGroupService = async (
    edgeApplicationId,
    params = { pageSize: CONSTANTS.DEFAULT_PAGE_SIZE }
  ) => {
    const cacheOptions = this.#getCacheOptions(params)

    return this.queryAsync({
      key: [CONSTANTS.CACHE_KEY, `edgeAppId=${edgeApplicationId}`, params],
      cache: this.cacheType.GLOBAL,
      queryFn: async () => {
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
      },
      ...cacheOptions
    })
  }

  loadDeviceGroupService = async (edgeApplicationId, deviceGroupId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, `/${deviceGroupId}`)
    })

    return this.adapter?.transformLoadDeviceGroup?.(data) ?? data.data
  }

  createDeviceGroupService = async (payload) => {
    const { edgeApplicationId } = payload
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    const result = await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId),
      body
    })

    await this.invalidateListCache(edgeApplicationId)

    return {
      id: result.data.data.id,
      feedback: CONSTANTS.MESSAGES.CREATE_SUCCESS,
      edgeApplicationId
    }
  }

  editDeviceGroupService = async (edgeApplicationId, payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PUT',
      url: this.getUrl(edgeApplicationId, `/${payload.id}`),
      body
    })

    await this.invalidateListCache(edgeApplicationId)

    return CONSTANTS.MESSAGES.UPDATE_SUCCESS
  }

  deleteDeviceGroupService = async (edgeApplicationId, deviceGroupId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${deviceGroupId}`)
    })

    await this.invalidateListCache(edgeApplicationId)

    return CONSTANTS.MESSAGES.DELETE_SUCCESS
  }
}

export const deviceGroupService = new DeviceGroupService()
