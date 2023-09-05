import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeNetworkListBaseUrl } from "./make-network-list-base-url";

export const editNetworkListService = async (payload) => {
  const bodyRequest = adapt(payload);
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeNetworkListBaseUrl()}/${payload.id}`,
      method: 'PUT',
      body: bodyRequest
    })
    
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return{
    name: payload.name,
    list_type: payload.listType,
    items_values: payload.networkContentList,
  }
}