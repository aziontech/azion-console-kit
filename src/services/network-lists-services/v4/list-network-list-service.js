import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-service'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { formatExhibitionDate } from '@/helpers/convert-date'

export const listNetworkListService = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({
    fields,
    ordering,
    page,
    pageSize,
    search
  })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
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
