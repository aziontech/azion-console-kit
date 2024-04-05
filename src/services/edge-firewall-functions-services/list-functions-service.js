import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'

export const listFunctionsService = async ({
  edgeFirewallID,
  orderBy = 'id',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallID}/functions_instances?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const bodyResults = httpResponse.body.results

  const parsedFunctions = bodyResults?.map((edgeFirewall) => {
    return {
      id: edgeFirewall.id,
      edgeFunctionId: edgeFirewall.edge_function,
      name: edgeFirewall.name,
      lastEditor: edgeFirewall.last_editor,
      lastModified: edgeFirewall.last_modified,
      args: edgeFirewall.json_args
    }
  })

  return {
    body: parsedFunctions,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('order_by', orderBy)
  searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}
