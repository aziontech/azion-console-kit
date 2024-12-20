import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../../axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const editEdgeFunctionsService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Your edge function has been updated'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}

const adapt = (payload) => {
  const parsedArgs = JSON.parse(payload.args)
  return {
    name: payload.name,
    code: payload.code,
    language: payload.language,
    initiator_type: payload.initiatorType,
    json_args: parsedArgs,
    active: payload.active
  }
}
