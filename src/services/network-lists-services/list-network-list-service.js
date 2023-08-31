import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-base-url'

export const listNetworkListService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeNetworkListBaseUrl()}?${searchParams.toString()}`,
      method: 'GET',
    })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
    const isArray = Array.isArray(httpResponse.body.results);
    const listTypeMap = {
      'ip_cidr': 'IP/CIDR',
      'asn': 'ASN',
      'countries':'Countries'
    }
  
    const networkList = isArray ? httpResponse.body.results.map((element) => ({
      id: element.id,
      name: element.name,
      lastEditor: element.last_editor,
      listType: listTypeMap[element.list_type],
      lastModified:  new Intl.DateTimeFormat('us', { dateStyle: 'full',timeStyle: 'short' }).format(new Date(element.last_modified)),
    })) : [];
  
    return {
      body: networkList,
      statusCode: httpResponse.statusCode
    }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams();
  searchParams.set('order_by', orderBy);
  searchParams.set('sort', sort);
  searchParams.set('page', page);
  searchParams.set('page_size', pageSize);

  return searchParams;
}
