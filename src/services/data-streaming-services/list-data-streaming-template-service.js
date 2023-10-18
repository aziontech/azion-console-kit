import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDataStreamingTemplateBaseUrl } from './make-data-streaming-template-base-url'

export const listDataStreamingTemplateService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingTemplateBaseUrl()}`,
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

  return {
    body: parsedTemplate,
    statusCode: httpResponse.statusCode
  }
}
