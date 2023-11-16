import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'

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
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const definedKeys = ['first_name', 'last_name', 'email', 'teams_ids']
  let key = definedKeys.find((key) => httpResponse.body[key])

  // Case not found any defined key
  if (!key) {
    key = Object.keys(httpResponse.body)[0]
  }

  const value = httpResponse.body[key]
  const isString = typeof value === 'string'
  const isArray = Array.isArray(value)

  let message = ''
  if (isString) message = value
  if (isArray) message = value[0]

  return `${key}: ${message}`
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
      throw new Error(apiError400).message
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
