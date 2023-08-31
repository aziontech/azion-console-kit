import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter"
import { makeEdgeFirewallBaseUrl } from "./make-edge-firewall-base-url"

export const deleteEdgeFirewallService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
    url:`${makeEdgeFirewallBaseUrl()}/${id}`,
    method:'DELETE',
  })

  return parseHttpResponse(httpResponse)
}

