import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const loadFunctionsInstanceService = async ({ edgeApplicationId, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/functions_instances/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const func = httpResponse.body.results
  const parsedBody = {
    id: func.id,
    edgeFunctionId: func.edge_function_id,
    name: func.name,
    args: func.args
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
