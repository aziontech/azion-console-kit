import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const deleteDeviceGroupService = async (deviceGroupKey, id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/device_groups/${deviceGroupKey}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
