import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDataStreamingBaseUrl } from './make-data-streaming-base-url'
import { makeDataStreamingTemplateBaseUrl } from './make-data-streaming-template-base-url'

export const listDataStreamingService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const getTemplateById = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingTemplateBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adaptTemplate(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adaptTemplate = (httpResponse) => {
  return {
    body: httpResponse.body.results,
    statusCode: httpResponse.statusCode
  }
}

const parseStatusData = (status) => {
  const parsedStatus = status
    ? {
        content: 'Active',
        severity: 'success'
      }
    : {
        content: 'Inactive',
        severity: 'danger'
      }

  return parsedStatus
}

const adapt = async (httpResponse) => {
  const mapDataSourceName = {
    http: 'Edge Applications',
    rtm_activity: 'Activity History',
    cells_console: 'Edge Functions',
    waf: 'WAF Events'
  }

  const parsedDataStreamings = await Promise.all(
    httpResponse.body?.results?.map(async (dataStreaming) => {
      const templateData = await getTemplateById({ id: dataStreaming.template_id })
      return {
        id: dataStreaming.id,
        name: dataStreaming.name,
        templateName: templateData.name,
        dataSource: mapDataSourceName[dataStreaming.data_source],
        endpointType: dataStreaming.endpoint.endpoint_type,
        active: parseStatusData(dataStreaming.active)
      }
    }) ?? []
  )

  return {
    body: parsedDataStreamings,
    statusCode: httpResponse.statusCode
  }
}
