import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeVersionControlSystemBaseUrl } from './make-version-control-system-base-url'
import * as Errors from '@/services/axios/errors'

export const listRepositoriesService = async (uuid, { pageSize = 200, ordering = 'name' } = {}) => {
  const searchParams = makeSearchParams({ pageSize, ordering })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVersionControlSystemBaseUrl()}/integrations/${uuid}/repositories?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedRepositories = httpResponse.body.results || httpResponse.body

  return {
    body: parsedRepositories,
    statusCode: httpResponse.statusCode
  }
}

const errorExtractor = (errorMessage) => {
  return errorMessage === 'Invalid scope.'
    ? 'Your scope does not contain any valid repositories.'
    : errorMessage
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
    case 200:
      return httpResponse.body
    case 400: {
      let errorMessage = errorExtractor(httpResponse.body.error)
      throw new Error(errorMessage).message
    }
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

const makeSearchParams = ({ pageSize, ordering }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('page_size', pageSize)
  searchParams.set('ordering', ordering)

  return searchParams
}
