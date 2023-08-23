import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeNetworkListBaseUrl } from "./make-network-list-base-url";

export const createNetworkListService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeNetworkListBaseUrl()}`,
      method: 'POST',
      body:payload
    })
    
  return parseHttpResponse(httpResponse)
}