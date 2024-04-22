import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeVersionControlSystemBaseUrl } from './make-version-control-system-base-url'
import * as Errors from '@/services/axios/errors'

export const listRepositoriesService = async (uuid, { pageSize = 200 } = {}) => {
  const searchParams = makeSearchParams({ pageSize })

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
    case 400:
      let errorMessage = httpResponse.body.error
      errorMessage =
        errorMessage === 'Invalid scope.'
          ? 'Your scope does not contain any valid repositories.'
          : errorMessage
      throw new Error(errorMessage).message
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

const makeSearchParams = ({ pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('page_size', pageSize)

  return searchParams
}
