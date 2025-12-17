import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeTeamPermissionBaseUrl } from './make-team-permission-base-url'
import { teamsService } from '@/services/users-services/list-teams-service'

export const createTeamPermissionsService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTeamPermissionBaseUrl()}`,
    method: 'POST',
    body: adapt(payload)
  })

  const result = parseHttpResponse(httpResponse)
  await teamsService.invalidateTeamsCache()
  return result
}

const adapt = (payload) => {
  return {
    name: payload.name,
    permissions_ids: payload.permissions.map((item) => item.id),
    is_active: payload.isActive
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {Object} httpResponse.body.data - The data inside response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your Team Permission has been created',
        urlToEditView: `/teams-permission/edit/${httpResponse.body.data.id}`
      }
    case 400:
      const key = Object.keys(httpResponse.body)[0]
      const msg = httpResponse.body[key][0]

      const msgError = `${key} ${msg}`
      throw new Error(msgError).message
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
