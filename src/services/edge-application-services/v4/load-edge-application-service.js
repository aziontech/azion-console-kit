import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadEdgeApplicationsService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${id}?fields=id,name`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const data = httpResponse.body?.data
  const parsedEdgeApplications = {
    id: data.id,
    name: data.name
  }

  return {
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}
