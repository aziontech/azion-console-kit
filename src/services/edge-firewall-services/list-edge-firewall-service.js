import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'

export const listEdgeFirewallService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
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
        lastModify: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
          new Date(edgeFirewall.last_modified)
        ),
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

  return {
    body: parsedEdgeFirewalls,
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
