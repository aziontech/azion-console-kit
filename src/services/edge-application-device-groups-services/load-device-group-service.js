import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const loadDeviceGroupService = async ({ edgeApplicationId, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/device_groups/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const deviceGroup = httpResponse.body.results
  const parsedBody = {
    id: deviceGroup.id,
    name: deviceGroup.name,
    userAgent: deviceGroup.user_agent
  }
  
  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
