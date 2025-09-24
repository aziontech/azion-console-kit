import { BaseService } from '@/services/v2/base/query/baseService'
import { DeviceGroupAdapter } from './edge-app-device-group-adapter'

export class DeviceGroupService extends BaseService {
  constructor() {
    super()
    this.adapter = DeviceGroupAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  getUrl(edgeApplicationId, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/device_groups${suffix}`
  }

  listDeviceGroupService = async (edgeApplicationId, params = { pageSize: 10 }) => {
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

    return 'Device Group successfully updated'
  }

  deleteDeviceGroupService = async (edgeApplicationId, deviceGroupId) => {
    const { data } = await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${deviceGroupId}`)
    })

    return data.results
  }
}

export const deviceGroupService = new DeviceGroupService()
