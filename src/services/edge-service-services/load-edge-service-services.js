import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeServiceBaseUrl } from './make-edge-service-base-url'

export const loadEdgeServiceServices = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeServiceBaseUrl()}/${id}?${makeSearchParams()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const makeSearchParams = () => {
  const searchParams = new URLSearchParams()
  searchParams.set('fields', 'id,name,is_active,modules')
  return searchParams
}

/**
 * Converts an object of variables into a key-value pair string, separated by newlines.
 *
 * @param {Object} variables - An object containing key-value pairs.
 * @return {string} A string representation of the key-value pairs, separated by newlines.
 * @example
 * const variables = {
 *   key1: 'value1',
 *   key2: 'value2',
 *   key3: 'value3'
 * };
 * const result = convertToKeyValuePairText(variables);
 * console.log(result);
 * // key1=value1
 * // key2=value2
 * // key3=value3
 */
function convertToKeyValuePairText(variables) {
  if (!variables) return ''

  return Object.entries(variables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

const adapt = (httpResponse) => {
  const { id, name, is_active, modules } = httpResponse.body.data
  const parsedBody = {
    id,
    name,
    active: is_active,
    code: convertToKeyValuePairText(modules)
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
