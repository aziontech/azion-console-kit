import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeIntelligentDNSBaseUrl } from './make-intelligent-dns-base-url'

export const listIntelligentDNSService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIntelligentDNSBaseUrl()}?${searchParams.toString()}`,
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

  const parsedIntelligentDNS = isArray
    ? httpResponse.body.results.map((intelligentDNS) => ({
        id: intelligentDNS.id,
        name: intelligentDNS.name,
        domain: intelligentDNS.domain,
        status: parseStatusData(intelligentDNS.is_active)
      }))
    : []

  return {
    body: parsedIntelligentDNS,
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
