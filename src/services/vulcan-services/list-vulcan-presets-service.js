import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'

export const listVulcanPresetsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: 'v4/utils/presets',
    method: 'GET'
  })
  return parseHttpResponse(httpResponse)
}
