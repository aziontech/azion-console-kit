import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeNetworkListBaseUrl } from "./make-network-list-base-url";

export const listNetworkListService = async ({ page}) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeNetworkListBaseUrl()}?page=${page}`,
      method: 'GET',
    })

  httpResponse = adapt(httpResponse);
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
    const isArray = Array.isArray(httpResponse.body.results);
  
    const networkList = isArray ? httpResponse.body.results.map((element) => ({
      id: element.id,
      name: element.name,
      lastEditor: element.last_editor,
      listType: element.list_type === 'ip_cidr' || element.list_type === 'asn'? element.list_type.toUpperCase(): 'Countries',
      lastModified:  new Intl.DateTimeFormat('us', { dateStyle: 'full',timeStyle: 'short' }).format(new Date(element.last_modified)),
    })) : [];
  
    return {
      body: networkList,
      statusCode: httpResponse.statusCode
    }
}