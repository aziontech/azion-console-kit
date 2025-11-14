import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'

export const deleteEdgeApplicationService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  const result = parseHttpResponse(httpResponse)

  const { edgeAppService } = await import('@/services/v2/edge-app/edge-app-service')
  await edgeAppService.invalidateListCache()

  return result
}
