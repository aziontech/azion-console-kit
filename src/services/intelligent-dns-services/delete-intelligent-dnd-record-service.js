import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeIntelligentDNSBaseUrl } from "./make-intelligent-dns-base-url";

export const deleteIntelligentDNSRecordService = async (id, record_id) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeIntelligentDNSBaseUrl()}/${id}/records/${record_id}`,
      method: 'DELETE',
    })
    
  return parseHttpResponse(httpResponse)
}
