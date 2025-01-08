import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'

export const cloneWafRulesService = async ({ wafRulesName, payload }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/${payload.id}/clone`,
    method: 'POST',
    body: adapt(payload, wafRulesName)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload, wafRulesName) => {
  return {
    id: payload.id,
    name: wafRulesName
  }
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
      return {
        feedback: 'Your waf rule has been cloned',
        urlToEditView: `/waf/edit/${httpResponse.body.data.id}`
      }
    case 400:
      const apiError = extractApiError(httpResponse.body)
      throw new Error(apiError).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

/**
 * @param {Object} body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (body) => {
  for (const keyError of Object.keys(body)) {
    const errorValue = Array.isArray(body[keyError]) ? body[keyError][0] : body[keyError]
    if (typeof errorValue === 'string') return errorValue
    if (typeof errorValue === 'object' && errorValue.message) return errorValue.message[0]
  }
  return ''
}
