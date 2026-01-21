import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '@services/axios/AxiosHttpClientAdapter'
import { makeTeamPermissionBaseUrl } from '@services/team-permission/make-team-permission-base-url'

export const loadTeamPermissionService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTeamPermissionBaseUrl()}/${id}`,
    method: 'GET'
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  return {
    id: httpResponse.body.data.id,
    name: httpResponse.body.data.name,
    permissions: httpResponse.body.data.permissions,
    isActive: httpResponse.body.data.is_active
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const error = httpResponse.body?.errors.length > 0 ? httpResponse.body?.errors[0] : null
  return error.detail
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return adapt(httpResponse)
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
