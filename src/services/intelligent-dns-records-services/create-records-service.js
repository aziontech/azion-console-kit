import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeIntelligentDNSBaseUrl } from "./make-intelligent-dns-base-url";

export const createRecordsService = async (payload) => {
  const adaptPayload = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeIntelligentDNSBaseUrl()}/${payload.intelligentDNSID}/records`,
      method: 'POST',
      body: adaptPayload
    })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    record_type: payload.selectedRecordType._value,
    entry: payload.name,
    answers_list: [
      payload.value
    ],
    ttl: payload.ttl,
    description: payload.description,
    weight: payload.weight,
  };
}
