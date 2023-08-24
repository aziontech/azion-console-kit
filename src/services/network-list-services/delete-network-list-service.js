import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeNetworkListBaseUrl } from "./make-network-list-base-url";

export const deleteNetworkListService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeNetworkListBaseUrl()}/${id}`,
      method: 'DELETE',
    })
    
  return parseHttpResponse(httpResponse)
}
