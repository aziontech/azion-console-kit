import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import {
  makeDataStreamingBaseUrl,
  makeDataStreamingDomainsBaseUrl,
  makeDataStreamingTemplateBaseUrl
} from './make-data-streaming-base-url'

export const listDataStreamingService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const listDataStreamingTemplateService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingTemplateBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adaptListAllTemplates(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const listDataStreamingDomainsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingDomainsBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adaptDomains(httpResponse)

  return parseHttpResponse(httpResponse)
}

const getTemplateById = async ({ id }) => {
  /***************************************************
   * @todo: API should be deliver this results as BFF
   ***************************************************/

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingTemplateBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adaptTemplate(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adaptListAllTemplates = (httpResponse) => {
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

const adaptTemplate = (httpResponse) => {
  return {
    body: httpResponse.body.results,
    statusCode: httpResponse.statusCode
  }
}

const adaptDomains = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const parsedDomains = isArray
    ? httpResponse.body.results.map((domain) => ({
        domainID: domain.domain_id,
        name: domain.name,
        selected: domain.selected
      }))
    : []

  return {
    body: parsedDomains,
    statusCode: httpResponse.statusCode
  }
}

const adapt = async (httpResponse) => {
  const mapDataSourceName = {
    http: 'Edge Applications',
    rtm_activity: 'Activity History',
    cells_console: 'Edge Functions',
    waf: 'WAF Events'
  }

  const parsedDataStreamings = await Promise.all(
    httpResponse.body.results?.map(async (dataStreaming) => {
      const templateData = await getTemplateById({ id: dataStreaming.template_id })
      return {
        id: dataStreaming.id,
        name: dataStreaming.name,
        templateName: templateData.name,
        dataSource: mapDataSourceName[dataStreaming.data_source],
        active: dataStreaming.active ? 'Yes' : 'No'
      }
    })
  )

  return {
    body: parsedDataStreamings,
    statusCode: httpResponse.statusCode
  }
}
