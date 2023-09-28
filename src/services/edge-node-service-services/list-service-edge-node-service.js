import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from '../edge-node-services/make-edge-node-list-base-url'

export const listService = async ({ id, page, bound }) => {
  const searchParams = makeSearchParams({ bound, page })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${id}/services?${searchParams.toString()}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
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
          status: element.is_active ? 'Enabled' : ''
        }))
      : []

  return {
    body: service,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({  page, bound }) => {
  const searchParams = new URLSearchParams()
  if(page) searchParams.set('page', page)
  searchParams.set('page_size', 1000000)
  searchParams.set('is_bound', bound)

  return searchParams
}

