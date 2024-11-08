import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWorkloadsBaseUrl } from './make-workloads-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { convertArrayObjectsToCamelCase } from '@/helpers/convert-array-objects-to-camel-case'

export const listWorkloadsService = async ({
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 200,
  search = ''
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

/**
/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  return `${errorSchema[key]}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const apiKeyError = Object.keys(httpResponse.body)[0]
  const apiValidationError = extractErrorKey(httpResponse.body, apiKeyError)

  return `${apiValidationError}`
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode === 200) {
    const results = httpResponse.body.results || []

    const parsedResults = convertArrayObjectsToCamelCase(results)

    return {
      body: { results: parsedResults, count: httpResponse.body.count },
      statusCode: httpResponse.statusCode
    }
  } else {
    const errorMessage = extractApiError(httpResponse)
    throw new Error(errorMessage).message
  }
}
