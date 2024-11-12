import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeAccountsManagementBaseUrl } from './make-accounts-management-base-url'

/**
 * @function createAccountByTypeService
 * @description Send a request to the /accounts endpoint to create a new account by type.
 * @param {Object} payload Payload to be sent in the request body.
 * @param {String} accountType ('Client'|'Reseller'|'Group') The type of the account to be created.
 * @returns {Promise<Object | Error>} The response from the server or an error if the request fails.
 */
export const createAccountByTypeService = async (payload, accountType) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountsManagementBaseUrl()}`,
    method: 'POST',
    body: {
      ...adapt(payload),
      account_type: accountType
    }
  })
  return parseHttpResponse(httpResponse, accountType)
}

const adapt = (payload) => {
  const parsedBody = {
    address: payload.address,
    name: payload.accountName,
    user: {
      email: payload.email,
      first_name: payload.firstName,
      last_name: payload.lastName
    },
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
  if (hasErrorInEmail) {
    return httpResponse.body.user.email[0]
  }

  const [firstKey] = Object.keys(httpResponse.body)
  return httpResponse.body[firstKey]
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {Object} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse, accountType) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Account saved.',
        urlToEditView: `/${accountType}/management`
      }
    case 400:
      const errorMessage = extractApiError(httpResponse)
      throw new Error(errorMessage).message
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
