import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'

export const createDomainService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}`,
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(httpResponse)
}
