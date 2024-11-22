import { AxiosHttpClientAdapter, parseHttpResponse } from '../../axios/AxiosHttpClientAdapter'
import { makeEdgeDNSBaseUrl } from './make-edge-dns-base-url'

export const listEdgeDNSServiceV4 = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
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
        status: parseStatusData(edgeDNS.is_active)
      }))
    : []

  return {
    body: parsedEdgeDNS,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  // searchParams.set('ordering', orderBy)
  // searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}
