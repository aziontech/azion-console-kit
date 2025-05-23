import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadEdgeApplicationsService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const edgeApplication = httpResponse.body?.data

  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const parsedEdgeApplications = {
    id: edgeApplication.id,
    name: edgeApplication.name,
    edgeCacheEnabled: edgeApplication.modules.edge_cache_enabled,
    edgeFunctionsEnabled: edgeApplication.modules.edge_functions_enabled,
    applicationAcceleratorEnabled: edgeApplication.modules.application_accelerator_enabled,
    imageProcessorEnabled: edgeApplication.modules.image_processor_enabled,
    tieredCacheEnabled: edgeApplication.modules.tiered_cache_enabled,
    isActive: edgeApplication.active,
    debug: edgeApplication.debug,
    productVersion: edgeApplication.product_version
  }

  return {
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}
