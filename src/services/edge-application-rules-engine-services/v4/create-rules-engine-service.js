import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import * as Errors from '@/services/axios/errors'
import { adaptBehavior } from './helper-behavior'
import { extractApiError } from '@/helpers/extract-api-error'

export const createRulesEngineService = async (payload) => {
  const { edgeApplicationId } = payload
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplicationId}/rules`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse, edgeApplicationId)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    phase: payload.phase || 'default',
    active: payload.active !== undefined ? payload.active : true,
    behaviors: adaptBehavior(payload.behaviors),
    criteria: payload.criteria,
    description: payload.description || ''
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
      return { feedback: 'Rule successfully created' }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
