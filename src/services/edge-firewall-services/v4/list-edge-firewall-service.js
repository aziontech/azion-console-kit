import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { formatExhibitionDate } from '@/helpers/convert-date'

export const listEdgeFirewallService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}
const adapt = async (httpResponse) => {
  const parsedEdgeFirewalls = await Promise.all(
    httpResponse.body.results?.map(async (edgeFirewall) => {
      return {
        id: edgeFirewall.id,
        name: edgeFirewall.name,
        lastEditor: edgeFirewall.last_editor,
        modules: edgeFirewall.modules,
        debugRules: edgeFirewall.debug_rules,
        lastModify: formatExhibitionDate(edgeFirewall.last_modified, 'full', undefined),
        lastModifyDate: edgeFirewall.last_modified,
        status: edgeFirewall.is_active
          ? {
              content: 'Active',
              severity: 'success'
            }
          : {
              content: 'Inactive',
              severity: 'danger'
            }
      }
    })
  )

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedEdgeFirewalls,
    statusCode: httpResponse.statusCode
  }
}
