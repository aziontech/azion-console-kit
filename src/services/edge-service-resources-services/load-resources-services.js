import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeResourcesBaseUrl } from './make-resources-base-url'
import { parseSnakeToCamel } from '@/helpers'

export const loadResourcesServices = async ({ resourcesID, edgeServiceID }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResourcesBaseUrl()}/${edgeServiceID}/resources/${resourcesID}`,
    method: 'GET'
  })

  httpResponse.body = parseSnakeToCamel(httpResponse.body)

  return parseHttpResponse(httpResponse)
}
