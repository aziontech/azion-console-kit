import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const createEdgeApplicationService = async (payload) => {
  const { edgeApplicationId } = payload
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse, edgeApplicationId)
}

const adapt = (payload) => {
  return {
    name: payload.name
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
      return {
        feedback: 'Your edge application has been created',
        urlToEditView: `/edge-applications/config/${httpResponse.body.data.id}`,
        applicationId: httpResponse.body.data.id
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
