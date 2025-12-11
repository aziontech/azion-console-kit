import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { edgeAppV3Keys } from './load-edge-application-service'
import { edgeAppKeys } from '@/services/v2/edge-app/edge-app-service'

export const deleteEdgeApplicationService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  const result = parseHttpResponse(httpResponse)

  await queryClient.removeQueries({ queryKey: edgeAppV3Keys.all })
  await queryClient.removeQueries({ queryKey: edgeAppKeys.lists() })

  return result
}
