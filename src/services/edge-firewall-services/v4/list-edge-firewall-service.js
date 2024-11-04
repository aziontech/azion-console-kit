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
  // new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
  //   new Date(edgeFirewall.last_modified)
  const parsedEdgeFirewalls = await Promise.all(
    httpResponse.body.results?.map(async (edgeFirewall) => {
      return {
        id: edgeFirewall.id,
        name: edgeFirewall.name,
        lastEditor: edgeFirewall.last_editor,
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
