import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationErrorResponsesBaseUrl } from './make-edge-application-error-responses-base-url'

export const listErrorResponsesService = async ({ edgeApplicationId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationErrorResponsesBaseUrl()}/${edgeApplicationId}/error_responses`,
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
    originId: response.origin_id.toString(),
    errorResponses: response.error_responses.map((element) => {
      return {
        code: element.code.toString(),
        timeout: element.timeout,
        uri: element.uri,
        customStatusCode: element.custom_status_code
          ? Number(element.custom_status_code)
          : element.custom_status_code
      }
    })
  }
  return {
    statusCode: httpResponse.statusCode,
    body: parsedErrorResponses
  }
}
