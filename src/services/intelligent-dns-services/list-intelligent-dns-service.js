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
  const isArray = Array.isArray(httpResponse.body);


  const parsedIntelligentDNS = isArray ? httpResponse.body.map((intelligentDNS) => ({
    id: intelligentDNS.uuid,
    name: intelligentDNS.name,
    domain: intelligentDNS.domain,
    isActive: intelligentDNS.is_active,
  })) : [];

  return {
    body: parsedIntelligentDNS,
    statusCode: httpResponse.statusCode
  }
}
