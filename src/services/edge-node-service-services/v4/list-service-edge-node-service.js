import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from '@/services/edge-node-services/v4/make-edge-node-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listServiceEdgeNodeService = async ({
  edgeNodeId,
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${edgeNodeId}/services?${searchParams.toString()}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
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

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const service =
    isArray && httpResponse.body.results.length
      ? httpResponse.body.results.map((element) => ({
          id: element.id,
          name: element.service_name,
          serviceId: element.service_id,
          lastEditor: element.last_editor,
          lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(element.last_modified)
          ),
          status: parseStatusData(element.active)
        }))
      : []

  return {
    body: service,
    statusCode: httpResponse.statusCode
  }
}
