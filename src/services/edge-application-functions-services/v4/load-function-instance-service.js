import { AxiosHttpClientAdapter, parseHttpResponse } from '../../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadFunctionService = async ({ edgeApplicationID, functionID }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplicationID}/functions/${functionID}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const parsedVariable = {
    id: httpResponse.body.data.id,
    edgeFunctionID: httpResponse.body.data.edge_function,
    name: httpResponse.body.data.name,
    args: JSON.stringify(httpResponse.body.data.json_args, null, '\t')
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
