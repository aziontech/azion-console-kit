import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeIntelligentDNSBaseUrl } from "./make-intelligent-dns-base-url";

export const loadIntelligentDNSService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIntelligentDNSBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const intelligentDNS = httpResponse.body.results

  const parsedIntelligentDNS = {
    id: intelligentDNS.id,
    name: intelligentDNS.name,
    domain: intelligentDNS.domain,
    isActive: intelligentDNS.is_active
  }

  return {
    body: parsedIntelligentDNS,
    statusCode: httpResponse.statusCode
  }
}
