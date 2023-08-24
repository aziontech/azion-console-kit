import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeNetworkListBaseUrl } from "./make-network-list-base-url";

export const listNetworkListService = async ({ page}) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeNetworkListBaseUrl()}?page=${page}`,
      method: 'get',
    })

  httpResponse = adapt(httpResponse);
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
    const isArray = Array.isArray(httpResponse.body.results);
  
    const networkList = isArray ? httpResponse.body.results.map((element) => ({
      id: element.id,
      name: element.name,
      last_editor: element.last_editor,
      list_type: element.list_type,
      last_modified:  element.last_modified,
    })) : [];
  
    return {
      body: networkList,
      statusCode: httpResponse.statusCode
    }
}