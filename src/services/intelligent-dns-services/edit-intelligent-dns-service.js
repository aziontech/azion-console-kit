import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeIntelligentDNSBaseUrl } from "./make-intelligent-dns-base-url";

export const editIntelligentDNSService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeIntelligentDNSBaseUrl()}/${payload.id}`,
      method: 'PUT',
      body: parsedPayload
    })
    
  return parseHttpResponse(httpResponse)
}

const adapt = (payload)=>{
  return {
    name: payload.name,
    domain: payload.domain,
    is_active: payload.isActive
  }
}
