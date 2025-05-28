export class DeviceGroupService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_application/applications'
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

    await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId),
      body
    })

    return {
      feedback: 'Device Group successfully created'
    }
  }

  editDeviceGroupService = async (edgeApplicationId, payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'PUT',
      url: this.getUrl(edgeApplicationId, `/${payload.id}`),
      body
    })

    return data.results
  }

  deleteDeviceGroupService = async (edgeApplicationId, deviceGroupId) => {
    const { data } = await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${deviceGroupId}`)
    })

    return data.results
  }
}
