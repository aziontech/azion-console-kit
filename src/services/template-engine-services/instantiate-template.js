import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTemplateEngineBaseUrl } from './make-template-engine-base-url'

export const instantiateTemplate = async (templateId, body) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTemplateEngineBaseUrl()}/templates/${templateId}/instantiate`,
    method: 'POST',
    body: body
  })
  return parseHttpResponse(httpResponse)
}
