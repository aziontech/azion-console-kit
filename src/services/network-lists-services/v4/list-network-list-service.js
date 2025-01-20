import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-service'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { formatExhibitionDate } from '@/helpers/convert-date'

export const listNetworkListService = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10,
  allResults = false
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await fetchAndAdaptNetworkList(searchParams)

  if (allResults) {
    const count = httpResponse.count
    let currentPage = page

    while (count > currentPage * 100) {
      currentPage += 1

      const newSearchParams = makeListServiceQueryParams({ fields, ordering, page: currentPage, pageSize, search, allResults })
      let response = await fetchAndAdaptNetworkList(newSearchParams)
      httpResponse.body = [...httpResponse.body, ...response.body]
    }
  }

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)
  const listTypeMap = {
    ip_cidr: 'IP/CIDR',
    asn: 'ASN',
    countries: 'Countries'
  }

  const networkList = isArray
    ? httpResponse.body.results.map((element) => ({
      id: element.id,
      stringId: element.id.toString(),
      name: element.name,
      lastEditor: element.last_editor,
      listType: listTypeMap[element.type],
      lastModified: formatExhibitionDate(element.last_modified, 'full', 'short'),
      lastModifiedDate: element.last_modified
    }))
    : []

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: networkList,
    statusCode: httpResponse.statusCode
  }
}

const fetchAndAdaptNetworkList = async (searchParams) => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })
  return adapt(httpResponse)
}
