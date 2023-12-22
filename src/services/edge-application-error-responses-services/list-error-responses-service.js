import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '../edge-application-services/ make-edge-application-v4-base-url'

export const listErrorResponsesService = async ({edgeApplicationId}) => {

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplicationId}/error_responses`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const errorResponses =  httpResponse.body.results[0]
  return {
    id: errorResponses.id,
    name: errorResponses.name,
    originId: errorResponses.origin_id,
    errorResponses: errorResponses.error_responses,
  }
}

