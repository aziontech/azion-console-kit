import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeNetworkListBaseUrl } from "./make-network-list-base-url";

export const createNetworkListService = async (payload) => {
  const bodyRequest = adapt(payload);
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeNetworkListBaseUrl()}`,
      method: 'POST',
      body: bodyRequest
    })
    
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return{
    name: payload.name,
    list_type: payload.networkListType,
    items_values: payload.networkContentList
  }
}