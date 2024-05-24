import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDataStreamTemplateBaseUrl } from './make-data-stream-template-base-url'

export const listDataStreamTemplateService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamTemplateBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const parsedTemplate = isArray
    ? httpResponse.body.results.map((template) => ({
      label: template.name,
      value: template.id,
      template: template.template_model
    }))
    : []

  const customTemplate = { label: 'Custom Template', value: 'CUSTOM_TEMPLATE', template: '' }
  parsedTemplate.push(customTemplate)

  return {
    body: parsedTemplate,
    statusCode: httpResponse.statusCode
  }
}
