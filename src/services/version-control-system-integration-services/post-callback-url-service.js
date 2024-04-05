import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVersionControlSystemBaseUrl } from './make-version-control-system-base-url'

export const postCallbackUrlService = async (path, body) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVersionControlSystemBaseUrl()}${path}`,
    method: 'POST',
    body: body
  })

  return parseHttpResponse(httpResponse)
}
