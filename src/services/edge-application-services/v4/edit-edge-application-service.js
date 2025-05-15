import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const editEdgeApplicationsService = async (payload) => {
  const { edgeApplicationId } = payload
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse, edgeApplicationId)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    modules: {
      edge_cache_enabled: payload.edgeCacheEnabled,
      edge_functions_enabled: payload.edgeFunctionsEnabled,
      application_accelerator_enabled: payload.applicationAcceleratorEnabled,
      image_processor_enabled: payload.imageProcessorEnabled,
      tiered_cache_enabled: payload.tieredCacheEnabled
    },
    active: payload.isActive,
    debug: payload.debug
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Your edge application has been updated'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
