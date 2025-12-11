import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { workloadKeys } from '@/services/v2/workload/workload-service'

export const deleteDomainService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  queryClient.removeQueries({ queryKey: workloadKeys.lists() })

  return parseHttpResponse(httpResponse)
}
