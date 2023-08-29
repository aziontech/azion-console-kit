import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeIntelligentDNSBaseUrl } from "./make-intelligent-dns-base-url";

export const deleteRecordsService = async ({ id, recordId }) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeIntelligentDNSBaseUrl()}/${id}/records/${recordId}`,
      method: 'DELETE',
    })
    
  return parseHttpResponse(httpResponse)
}
