import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from '../edge-node-services/make-edge-node-base-url'

export const listServiceEdgeNodeService = async ({ id, page, bound }) => {
  const searchParams = makeSearchParams({ bound, page })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${id}/services?${searchParams.toString()}`,
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
  const isArray = Array.isArray(httpResponse.body.services)

  const service =
    isArray && httpResponse.body.services.length
      ? httpResponse.body.services.map((element) => ({
          id: element.bind_id,
          name: element.name,
          serviceId: element.service_id,
          lastEditor: element.last_editor,
          lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(element.updated_at)
          ),
          status: parseStatusData(element.is_active)
        }))
      : []

  return {
    body: service,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ page, bound }) => {
  const searchParams = new URLSearchParams()
  if (page) searchParams.set('page', page)
  searchParams.set('page_size', 1000000)
  searchParams.set('is_bound', bound)

  return searchParams
}
