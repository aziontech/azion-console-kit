import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'
import * as Errors from '@/services/axios/errors'

export const createUsersService = async (payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}`,
    method: 'POST',
    body: bodyRequest
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    language: payload.selectedLanguage,
    timezone: payload.selectedTimezone,
    country_call_code: payload.selectedCountry.value,
    mobile: payload.mobile?.toString(),
    is_account_owner: payload.userIsOwner,
    teams_ids: payload.selectedTeam,
    two_factor_enabled: payload.twoFactorEnabled
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
      return {
        feedback: 'Your user has been created',
        urlToEditView: '/users'
      }
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 400:
      const apiError = getFirstApiError(httpResponse.body)
      throw new Error(apiError).message
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

const getFirstApiError = (body) => {
  for (let key in body) {
    if (Array.isArray(body[key]) && body[key].length > 0) {
      return body[key][0]
    }
  }
  return null
}
