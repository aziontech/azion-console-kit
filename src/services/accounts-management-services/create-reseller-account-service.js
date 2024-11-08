import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeAccountsManagementBaseUrl } from './make-accounts-management-base-url'

export const createResellerAccountService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountsManagementBaseUrl()}`, // Se der errado, trocar o make para o da raiz
    method: 'POST',
    body: adapt(payload)
  })
  return parseHttpResponse(httpResponse)
}

// const adapt = (payload) => {
//   const fieldMappings = {
//     address: 'address',
//     city: 'city',
//     clientId: 'client_id',
//     country: 'country',
//     id: 'id',
//     isDeleted: 'is_deleted',
//     name: 'name',
//     parentId: 'parent_id',
//     region: 'region',
//     companyName: 'company_name',
//     isActive: 'is_active',
//     uniqueIdentifier: 'unique_identifier',
//     isSocialLoginEnabled: 'is_social_login_enabled',
//     isEnabledMfaToAllUsers: 'is_enabled_mfa_to_all_users',
//     companySize: 'company_size',
//     jobFunction: 'job_function',
//     firstLogin: 'first_login',
//     complement: 'complement',
//     postalCode: 'postal_code',
//     role: 'role',
//     billingEmails: 'billing_emails',
//     status: 'status',
//     isTrustworthy: 'is_trustworthy',
//     mapGroupId: 'map_group_id'
//   }

//   const adaptedPayload = Object.keys(fieldMappings).reduce((acc, key) => {
//     if (payload[key]) {
//       acc[fieldMappings[key]] = payload[key]
//     }
//     return acc
//   }, {})

//   adaptedPayload.account_type = 'reseller'

//   return adaptedPayload
// }

const adapt = (payload) => {
  const parsedBody = {
    address: payload.address,
    name: payload.name,
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

  if (payload.parent_id) {
    parsedBody.parent_id = payload.parentId
  }

  parsedBody.account_type = 'reseller'

  return parsedBody
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
      return 'Account saved'
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
