import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'

export const postCallbackUrlService = async (path, body) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: path,
    method: 'POST',
    body: body
  })

  return Promise.resolve(parseHttpResponse(httpResponse))
}
