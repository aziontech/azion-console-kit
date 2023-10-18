import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeIntelligentDNSRecordsBaseUrl } from './make-intelligent-dns-records-base-url'

export const deleteRecordsService = async ({ recordID, intelligentDNSID }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIntelligentDNSRecordsBaseUrl()}/${intelligentDNSID}/records/${recordID}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
