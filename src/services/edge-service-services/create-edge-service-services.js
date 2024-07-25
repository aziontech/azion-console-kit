import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeEdgeServiceBaseUrl } from './make-edge-service-base-url'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const createEdgeServiceServices = async (payload) => {
  const adaptPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeServiceBaseUrl()}`,
    method: 'POST',
    body: adaptPayload
  })

  return parseHttpResponse(httpResponse)
}

/**
 * Parses a string of variables in the format `NAME=VALUE\nNAME=VALUE\n...`
 * into an array of objects with the format `{ key:value }`.
 *
 * @param {string} variablesToParse
 * @returns {Array<Object>} - An array of variables.
 * @example
 * parseCodeToVariables('VAR1=val1\nVAR2=val2');
 * // Returns:
 * // [
 * //   {VAR1: 'val1'},
 * //   {VAR2: 'val2'}
 * // ]
 */
const parseCodeToVariables = (variablesToParse) => {
  if (!variablesToParse) return []
  const edgeServiceVariables = variablesToParse.trim().split(/\r?\n/)

  const parsedEdgeServiceVariables = edgeServiceVariables.map((edgeServiceVariable) => {
    const [edgeServiceVariableName, ...edgeServiceVariableValue] = edgeServiceVariable.split('=')
    const value = edgeServiceVariableValue.join('')
    const key = edgeServiceVariableName.trim()
    return { [key]: value.trim() }
  })
  return parsedEdgeServiceVariables
}

const adapt = (payload) => {
  const { active, name, code } = payload
  return {
    is_active: active,
    name,
    modules: parseCodeToVariables(code)
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {{feedback: string, urlToEditView: string}} - The success response.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your Edge Service has been created',
        urlToEditView: `/edge-services/edit/${httpResponse.body.data.id}`
      }
    case 202:
      return {
        feedback: 'Your Edge Service is processing and will be available shortly',
        urlToEditView: `/edge-services/edit/${httpResponse.body.data.id}`
      }
    case 400:
      throw new Errors.NotFoundError().message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 406:
      throw new Errors.NotAcceptableError().message
    case 429:
      throw new Errors.ToManyRequestsError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
