import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const loadFunctionService = async ({ edgeApplicationID, functionID }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationID}/functions_instances/${functionID}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedVariable = {
    id: httpResponse.body.results.id,
    edgeFunctionID: httpResponse.body.results.edge_function_id,
    name: httpResponse.body.results.name,
    args: JSON.stringify(httpResponse.body.results.args)
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
