import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-service'
import { formatExhibitionDate } from '@/helpers/convert-date'

export const loadNetworkListService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { data } = httpResponse.body
  const listTypeMap = {
    ip_cidr: 'IP/CIDR',
    asn: 'ASN',
    countries: 'Countries'
  }

  const networkList = {
    id: data.id,
    stringId: data.id.toString(),
    name: data.name,
    lastEditor: data.last_editor,
    listType: listTypeMap[data.type],
    lastModified: formatExhibitionDate(data.last_modified, 'full', 'short'),
    lastModifiedDate: data.last_modified
  }

  return {
    body: networkList,
    statusCode: httpResponse.statusCode
  }
}
