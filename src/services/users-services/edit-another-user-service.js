import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'
import * as Errors from '@/services/axios/errors'
import { getFirstApiError } from '@/helpers'

export const editAnotherUserService = async (payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}/${payload.id}`,
    method: 'PATCH',
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
    is_active: payload.isActive,
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
    case 200:
      return 'Your user has been updated'
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
