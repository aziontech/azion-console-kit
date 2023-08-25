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
  let itemValue = payload.countries;
  
  const checkListTypeIsAsnAndHasValue = payload.listType === 'asn' && payload.asn
  const checkListTypeIsIPAndHasValue =payload.listType === 'ip_cidr' && payload.ipCidr

  if (checkListTypeIsAsnAndHasValue) {
    itemValue = payload.asn.trim().split('\n');
  }
  if (checkListTypeIsIPAndHasValue) {
    itemValue = payload.ipCidr.trim().split('\n');
  }


  return{
    list_type: payload.listType,
    name: payload.name,
    items_values: itemValue
  }
}