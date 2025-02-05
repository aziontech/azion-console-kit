import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'

export const loadEdgeApplicationsDropdownService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${id}?fields=id,name`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const edgeApplication = httpResponse.body?.data
  const parsedEdgeApplications = {
    id: edgeApplication.id,
    name: edgeApplication.name
  }

  return {
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}
