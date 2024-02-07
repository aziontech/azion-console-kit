import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeAccountSettingsBaseUrl } from './make-account-settings-base-url'

export const getAccountSettingsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makeAccountSettingsBaseUrl(),
    method: 'GET'
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (response) => {
  return {
    accountName: response.name,
    clientId: response.client_id,
    companyName: response.company_name,
    uniqueIdentifier: response.unique_identifier,
    billingEmails: response.billing_emails,
    postalCode: response.postal_code,
    country: response.country,
    region: response.region,
    city: response.city,
    address: response.address,
    complement: response.complement,
    isSocialLoginEnabled: response.is_social_login_enabled,
    isEnabledMfaToAllUsers: response.is_enabled_mfa_to_all_users
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {Object} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return adapt(httpResponse.body.data)
    case 400:
      throw new Errors.InvalidApiRequestError().message
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
