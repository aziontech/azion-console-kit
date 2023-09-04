import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeIntelligentDNSBaseUrl } from './make-intelligent-dns-base-url'

export const deleteRecordsService = async ({ recordID, intelligentDNSID }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIntelligentDNSBaseUrl()}/${intelligentDNSID}/records/${recordID}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
