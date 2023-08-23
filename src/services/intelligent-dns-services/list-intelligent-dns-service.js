import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeIntelligentDNSBaseUrl } from "./make-intelligent-dns-base-url";

export const listIntelligentDNSService = async ({ page }) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeIntelligentDNSBaseUrl()}?page=${page}`,
      method: 'GET',
    })

  httpResponse = adapt(httpResponse);

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results);

  const parsedIntelligentDNS = isArray ? httpResponse.body.results.map((intelligentDNS) => ({
    id: intelligentDNS.id,
    name: intelligentDNS.name,
    domain: intelligentDNS.domain,
    isActive: intelligentDNS.is_active ? 'Yes' : 'No',
  })) : [];

  return {
    body: parsedIntelligentDNS,
    statusCode: httpResponse.statusCode
  }
}
