import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from '../edge-node-services/make-edge-node-list-base-url'

export const listService = async ({ id, page }) => {

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${id}/services?page=${page}`,
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
          id: element.service_id,
          name: element.name,
          lastEditor: element.last_editor,
          lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(element.updated_at)
          ),
          status: element.is_active ? 'Enabled' : ""
        }))
      : []

  return {
    body: service,
    statusCode: httpResponse.statusCode
  }
}
