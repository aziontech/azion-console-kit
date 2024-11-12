import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listFunctionsService = async ({
  edgeFirewallID,
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallID}/functions?${searchParams.toString()}`,
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

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedFunctions,
    statusCode: httpResponse.statusCode
  }
}
