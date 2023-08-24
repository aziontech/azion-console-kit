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
  console.log('entrie', payload);
  let itemValue = payload.countries;

  if (payload.listType === 'asn') {
    itemValue = payload.asn.trim().split('\n');
  }
  if (payload.listType === 'ip_cidr') {
    itemValue = payload.ipCidr.trim().split('\n');
  }


  return{
    list_type: payload.listType,
    name: payload.name,
    items_values: itemValue
  }
}