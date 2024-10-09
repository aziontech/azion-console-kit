import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listDeviceGroupsService = async ({
  id,
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${id}/device_groups?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedDeviceGroups = httpResponse.body.results?.map((deviceGroup) => {
    return {
      id: deviceGroup.id,
      deviceId: {
        content: deviceGroup.id
      },
      name: deviceGroup.name,
      userAgent: deviceGroup.user_agent
    }
  })

  return {
    body: parsedDeviceGroups,
    statusCode: httpResponse.statusCode
  }
}
