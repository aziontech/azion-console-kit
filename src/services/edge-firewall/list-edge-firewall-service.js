import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeEdgeFirewallBaseUrl } from "./make-edge-firewall-base-url";
import { makeDomainsBaseUrl } from '../domains-services/make-domains-base-url'

export const listEdgeFirewallService = async () => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeEdgeFirewallBaseUrl()}`,
      method: 'GET',
    })

  httpResponse = await adapt(httpResponse);

  return parseHttpResponse(httpResponse)
}

const getDomainById = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeDomainsBaseUrl()}/${id}`,
      method: 'GET',
    })

  httpResponse = adaptDomains(httpResponse);

  return parseHttpResponse(httpResponse)
}

const adaptDomains = (httpResponse) => {
  return {
    body: httpResponse.body.results,
    statusCode: httpResponse.statusCode
  }
}

const adapt = async (httpResponse) => {

  /***************************************************
   * @todo: API should be deliver this results as BFF
   ***************************************************/

  const parsedEdgeFirewalls = await Promise.all(
    httpResponse.body.results?.map(async (edgeFirewall) => {
      const domainsList = await Promise.all(
        edgeFirewall.domains?.map(async (domain) => {
          const domainData = await getDomainById({ id: domain })
          return domainData.domain_name
        })
      )

      return {
        id: edgeFirewall.id,
        name: edgeFirewall.name,
        lastEditor: edgeFirewall.last_editor,
        lastModify: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(edgeFirewall.last_modified)),
        domainsList: domainsList.join('<br>'),
        active: edgeFirewall.active ? 'Yes' : 'No',
      }
    })
  )

  return {
    body: parsedEdgeFirewalls,
    statusCode: httpResponse.statusCode
  }
}
