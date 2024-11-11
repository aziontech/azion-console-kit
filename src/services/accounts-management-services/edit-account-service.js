import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeAccountsManagementBaseUrl } from './make-accounts-management-base-url'
import * as Errors from '@/services/axios/errors'

export const editAccountService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountsManagementBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const parsedBody = {
    address: payload.address,
    name: payload.accountName,
    company_name: payload.companyName,
    is_active: payload.isActive,
    unique_identifier: payload.uniqueIdentifier,
    is_social_login_enabled: payload.isSocialLoginEnabled,
    is_enabled_mfa_to_all_users: payload.isEnabledMfaToAllUsers,
    company_size: payload.companySize,
    job_function: payload.jobFunction,
    first_login: payload.firstLogin,
    complement: payload.complement,
    city: payload.city,
    postal_code: payload.postalCode,
    role: payload.role,
    billing_emails: payload.billingEmails,
    status: payload.status,
    is_trustworthy: payload.isTrustworthy,
    map_group_id: payload.mapGroupId,
    parent_id: payload.parentId
  }

  parsedBody.terms_of_service_url = 'https://www.azion.com/en/documentation/agreements/tos/'
  parsedBody.currency_iso_code = 'BRL'

  return parsedBody
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const hasErrorInEmail = httpResponse.body.user && httpResponse.body.user.email
  if (!hasErrorInEmail) {
    return httpResponse.body.user.email[0]
  }

  const [firstKey] = Object.keys(httpResponse.body)
  return httpResponse.body[firstKey]
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
      return 'Your account has been edited'
    case 400:
      const message = extractApiError(httpResponse)
      throw new Error(message).message
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
