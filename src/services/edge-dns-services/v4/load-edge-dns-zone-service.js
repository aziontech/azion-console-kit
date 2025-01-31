import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeDNSBaseUrl } from './make-edge-dns-base-url'

export const loadEdgeDNSService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSBaseUrl()}/zones/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const edgeDNS = httpResponse.body?.data

  const parsedEdgeDNS = {
    id: edgeDNS.id,
    name: edgeDNS.name,
    domain: edgeDNS.domain,
    isActive: edgeDNS.active
  }

  return {
    body: parsedEdgeDNS,
    statusCode: httpResponse.statusCode
  }
}
