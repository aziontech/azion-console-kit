import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeDNSBaseUrl } from './make-edge-dns-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadEdgeDNSService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSBaseUrl()}/zones/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }
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
