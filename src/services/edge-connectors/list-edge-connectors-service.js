import { AxiosHttpClientAdapter, parseHttpResponse } from '@services/axios/AxiosHttpClientAdapter'
import { makeEdgeConnectorsV4BaseUrl } from './make-edge-connectors-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { getCurrentTimezone } from '@/helpers'

export const listEdgeConnectorsService = async ({
  ordering = 'name',
  page = 1,
  pageSize = 100,
  fields = '',
  search = ''
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeConnectorsV4BaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedEdgeConnectors = httpResponse.body.results?.map((edgeConnectors) => {
    return {
      id: edgeConnectors.id,
      name: edgeConnectors.name,
      type: edgeConnectors.type,
      header: edgeConnectors.type_properties.real_port_header,
      address: edgeConnectors.addresses
        .map((el) => {
          return el.address
        })
        .join(','),
      lastEditor: edgeConnectors.last_editor,
      lastModified: getCurrentTimezone(edgeConnectors.last_modified)
    }
  })

  return {
    body: parsedEdgeConnectors,
    statusCode: httpResponse.statusCode
  }
}
