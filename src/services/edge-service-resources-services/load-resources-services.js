import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeResourcesBaseUrl } from './make-resources-base-url'
import { parseSnakeToCamel } from '@/helpers'

export const loadResourcesServices = async ({ id, edgeServiceId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResourcesBaseUrl()}/${edgeServiceId}/resources/${id}`,
    method: 'GET'
  })

  httpResponse.body = parseSnakeToCamel(httpResponse.body)

  return parseHttpResponse(httpResponse)
}
