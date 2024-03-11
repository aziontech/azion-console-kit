import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeDNSBaseUrl } from './make-edge-dns-base-url'

export const loadEdgeDNSService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const edgeDNS = httpResponse.body.results

  const parsedEdgeDNS = {
    id: edgeDNS.id,
    name: edgeDNS.name,
    domain: edgeDNS.domain,
    isActive: edgeDNS.is_active
  }

  return {
    body: parsedEdgeDNS,
    statusCode: httpResponse.statusCode
  }
}
