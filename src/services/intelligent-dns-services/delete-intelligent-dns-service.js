import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeIntelligentDNSBaseUrl } from "./make-intelligent-dns-base-url";

export const deleteIntelligentDNSService = async (intelligentDNSID) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeIntelligentDNSBaseUrl()}/${intelligentDNSID}`,
      method: 'DELETE',
    })
    
  return parseHttpResponse(httpResponse)
}
