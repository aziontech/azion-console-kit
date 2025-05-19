import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeProjectSamplesBaseUrl } from './make-project-samples-base-url'
export const listVulcanPresetsService = async () => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeProjectSamplesBaseUrl()}`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}
