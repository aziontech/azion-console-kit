import { AxiosHttpClientAdapter, parseHttpResponse } from '../../axios/AxiosHttpClientAdapter'
// import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { makeEdgeDNSBaseUrl } from './make-edge-dns-base-url'

export const listEdgeDNSServiceV4 = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
}) => {
  const makeListServiceQueryParams = ({ fields, ordering, page, pageSize, search }) => {
    const params = new URLSearchParams()
    params.set('ordering', `"${ordering.replace(/([A-Z])/g, '_$1').toLowerCase()}"`)
    params.set('page', page)
    params.set('page_size', pageSize)
    params.set('fields', fields)
    params.set('search', search)

    return params
  }
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSBaseUrl()}/zones?${searchParams.toString()}`,
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

  const parsedEdgeDNS = isArray
    ? httpResponse.body.results.map((edgeDNS) => ({
        id: edgeDNS.id,
        name: edgeDNS.name,
        domain: {
          content: edgeDNS.domain
        },
        active: parseStatusData(edgeDNS.active)
      }))
    : []

  return {
    count: httpResponse.body?.count ?? 0,
    body: parsedEdgeDNS,
    statusCode: httpResponse.statusCode
  }
}
