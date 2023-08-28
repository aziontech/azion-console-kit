import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeIntelligentDNSBaseUrl } from "./make-intelligent-dns-base-url";

export const createRecordsService = async (payload) => {
  const adaptPayload = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeIntelligentDNSBaseUrl()}`,
      method: 'POST',
      body: adaptPayload
    })
    
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    record_type: payload.recordType,
    entry: payload.entry,
    ttl: payload.ttl,
    description: payload.description
  };
}
