import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/querySystem'

export const deleteDomainService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  queryClient.removeQueries({ queryKey: queryKeys.workload.lists() })

  return parseHttpResponse(httpResponse)
}
