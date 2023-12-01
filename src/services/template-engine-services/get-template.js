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
      createdAt: httpResponse.body.created_at,
      inputSchema: httpResponse.body.input_schema,
      instantiationData: httpResponse.body.instantiation_data,
      isActive: httpResponse.body.is_active,
      name: httpResponse.body.name,
      templateType: httpResponse.body.template_type,
      updatedAt: httpResponse.body.updated_at,
      uuid: httpResponse.body.uuid
    },
    statusCode: httpResponse.statusCode
  }
}
