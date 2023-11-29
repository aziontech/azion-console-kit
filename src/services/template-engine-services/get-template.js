import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTemplateEngineBaseUrl } from './make-template-engine-base-url'

export const getTemplate = async (templateId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTemplateEngineBaseUrl()}/templates/${templateId}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  return {
    body: {
import { parseSnakeToCamel } from '@/helpers'
[...]

body: parseSnakeToCamel(httpResponse.body)   
    },
    statusCode: httpResponse.statusCode
  }
}
