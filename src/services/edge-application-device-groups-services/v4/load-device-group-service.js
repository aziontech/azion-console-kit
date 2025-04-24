import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadDeviceGroupService = async ({ edgeApplicationId, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplicationId}/device_groups/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const deviceGroup = httpResponse.body.data
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
