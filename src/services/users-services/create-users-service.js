import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'
import * as Errors from '@/services/axios/errors'
import { getFirstApiError } from '@/helpers'

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
    language: payload.language,
    timezone: payload.timezone,
    country_call_code:
      payload.countryCallCode?.split(' - ').slice(1).join('-') || payload.countryCallCode,
    mobile: payload.mobile?.toString(),
    is_account_owner: payload.isAccountOwner,
    teams_ids: payload.teamsIds,
    two_factor_enabled: payload.twoFactorEnabled,
    is_active: payload.isActive
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
      throw new Error(apiError?.detail || apiError).message
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
