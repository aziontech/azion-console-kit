import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/querySystem'

export const deleteEdgeApplicationService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  const result = parseHttpResponse(httpResponse)

  await queryClient.removeQueries({ queryKey: queryKeys.edgeAppV3.all })
  await queryClient.removeQueries({ queryKey: queryKeys.edgeApp.lists() })

  return result
}
