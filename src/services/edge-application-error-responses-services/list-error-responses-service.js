import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'

export const listErrorResponsesService = async ({ edgeApplicationId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplicationId}/error_responses`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const response = httpResponse.body.results[0]
  const parsedErrorResponses = {
    id: response.id,
    name: response.name,
    originId: response.origin_id,
    errorResponses: response.error_responses.map((element) => {
      return {
        code: element.code.toString(),
        timeout: element.timeout,
        uri: element.uri,
        customStatusCode: element.custom_status_code
      }
    })
  }
  return {
    statusCode: httpResponse.statusCode,
    body: parsedErrorResponses
  }
}
