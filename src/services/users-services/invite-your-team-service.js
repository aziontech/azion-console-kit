import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const inviteYourTeamService = async (payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}`,
    method: 'POST',
    body: bodyRequest
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const parts = payload.name.split(' ')
  const firstName = parts[0]
  const lastName = parts.slice(1, parts.length).join(' ')

  return {
    first_name: firstName,
    last_name: lastName,
    email: payload.email,
    teams_ids: [payload.team]
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
    case 201:
      return 'Invite sent successfully'
    case 400:
      const apiError400 = extractApiError(httpResponse)
      // For validation errors (400) we want to throw an Error instance,
      // so tests can assert using `.rejects.toThrow(...)`.
      throw new Error(apiError400)
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
