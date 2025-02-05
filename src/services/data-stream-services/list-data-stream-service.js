import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDataStreamBaseUrl } from './make-data-stream-base-url'
import { makeDataStreamTemplateBaseUrl } from './make-data-stream-template-base-url'

export const listDataStreamService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const getTemplateById = async (listIdTemplates) => {
  if (!listIdTemplates) return []

  const templates = await Promise.all(
    listIdTemplates.map(async (id) => {
      let httpResponse = await AxiosHttpClientAdapter.request({
        url: `${makeDataStreamTemplateBaseUrl()}/${id}`,
        method: 'GET'
      })

      httpResponse = adaptTemplate(httpResponse)

      return parseHttpResponse(httpResponse)
    })
  )
  const cacheTemplate = []
  templates.forEach((template) => {
    cacheTemplate[template.id] = template
  })

  return cacheTemplate
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

  const templatesIDs =
    httpResponse.body?.results?.reduce((accumulator, current) => {
      if (current.template_id && !accumulator.includes(current.template_id)) {
        accumulator.push(current.template_id)
      }
      return accumulator
    }, []) || []

  const mapTemplateId = await getTemplateById(templatesIDs)

  const parsedDataStreams =
    httpResponse.body?.results?.map((dataStream) => {
      return {
        id: dataStream.id,
        name: dataStream.name,
        templateName: mapTemplateId[dataStream.template_id]?.name ?? 'Custom Template',
        dataSource: mapDataSourceName[dataStream.data_source],
        endpointType: dataStream.endpoint.endpoint_type,
        active: parseStatusData(dataStream.active)
      }
    }) ?? []

  return {
    body: parsedDataStreams,
    statusCode: httpResponse.statusCode
  }
}
