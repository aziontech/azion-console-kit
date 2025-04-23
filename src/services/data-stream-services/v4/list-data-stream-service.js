import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDataStreamBaseUrl } from './make-data-stream-base-url'
import { makeDataStreamSetsBaseUrl } from './make-data-stream-sets-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listDataStreamService = async ({
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10,
  search = ''
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: `${makeDataStreamBaseUrl()}?${searchParams.toString()}`,
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
        baseURL: '/',
        url: `${makeDataStreamSetsBaseUrl()}/${id}`,
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
    body: httpResponse.body.data,
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
      if (current.data_set_id && !accumulator.includes(current.data_set_id)) {
        accumulator.push(current.data_set_id)
      }
      return accumulator
    }, []) || []

  const mapTemplateId = await getTemplateById(templatesIDs)

  const parsedDataStreams =
    httpResponse.body?.results?.map((dataStream) => {
      return {
        id: dataStream.id,
        name: dataStream.name,
        templateName: mapTemplateId[dataStream.data_set_id]?.name ?? 'Custom Template',
        dataSource: mapDataSourceName[dataStream.data_source],
        endpointType: dataStream.endpoint.endpoint_type,
        active: parseStatusData(dataStream.active)
      }
    }) ?? []

  return {
    count: httpResponse.body.count,
    body: parsedDataStreams,
    statusCode: httpResponse.statusCode
  }
}
