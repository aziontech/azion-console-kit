import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import * as Errors from '@/services/axios/errors'

export const reorderEdgeApplicationRulesEngine = async (
  newOrderData,
  edgeApplication
) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplication}/rules/order`,
    method: 'PUT',
    body: adapt(newOrderData)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (newOrderData) => {
  const listNewOrderDataIds = newOrderData.map((data) => data.id)

  return { order: listNewOrderDataIds }
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

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Rules Engine successfully ordered'
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
