import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountsManagementBaseUrl } from './make-accounts-management-base-url'

export const editAccountService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountsManagementBaseUrl()}/${id}`,
    method: 'PATCH'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
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
