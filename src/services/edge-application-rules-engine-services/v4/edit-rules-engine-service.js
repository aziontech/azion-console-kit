import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import * as Errors from '@/services/axios/errors'
import { adaptBehavior } from './helper-behavior'
import { extractApiError } from '@/helpers/extract-api-error'

export const editRulesEngineService = async ({ id, payload, reorder = false }) => {
  const parsedPayload = adapt(payload, reorder)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${id}/rules/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload, reorder) => {
  let parsedPayload

  if (reorder) {
    parsedPayload = {
      order: parseInt(payload.order)
    }
  } else {
    const { name, phase, behaviors, criteria, isActive, description } = payload
    parsedPayload = {
      name,
      phase: phase.content || phase,
      behaviors: adaptBehavior(behaviors),
      criteria,
      is_active: isActive,
      description
    }
  }

  return parsedPayload
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Rule successfully updated'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
