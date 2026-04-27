import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import vulcanPresetsApi from './make-vulcan-presets-base-url'

export const listVulcanPresetsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: '/utils/presets',
      method: 'GET'
    },
    vulcanPresetsApi
  )
  return parseHttpResponse(httpResponse)
}