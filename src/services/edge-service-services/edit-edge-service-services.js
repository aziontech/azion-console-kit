import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeEdgeServiceBaseUrl } from './make-edge-service-base-url'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const editEdgeServiceServices = async (payload) => {
  const { edgeServiceID } = payload
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeServiceBaseUrl()}/${edgeServiceID}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const parseCodeToVariables = (code) => {
  if(!code) return []
  const lines = code.trim().split(/\r?\n/)

  const mapped = lines.map((line) => {
    const [name, ...rest] = line.split('=')
    const value = rest.join('=')
    return { name: name.trim(), value: value.trim() }
  })

  return mapped
}

const adapt = (payload) => {
  const { active, name, code } = payload
  const variables = code && parseCodeToVariables(code)
  return {
    active,
    name,
    variables
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return `Your edge service has been updated`
    case 400:
      throw new Errors.NotFoundError().message
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
