import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVcsIntegrationBaseUrl } from './make-vcs-integration-base-url'

export const postCallbackUrlService = async (path, body) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVcsIntegrationBaseUrl()}${path}`,
    method: 'POST',
    body: body
  })

  return parseHttpResponse(httpResponse)
}
