import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountsManagementBaseUrl } from './make-accounts-management-base-url'

export const loadAccountService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountsManagementBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const body = httpResponse.body.data

  const parsedBody = {
    id: body.id,
    accountName: body.name,
    companyName: body.company_name,
    isActive: body.is_active,
    uniqueIdentifier: body.unique_identifier,
    isSocialLoginEnabled: body.is_social_login_enabled,
    isEnabledMfaToAllUsers: body.is_enabled_mfa_to_all_users,
    companySize: body.company_size,
    jobFunction: body.job_function,
    country: body.country,
    firstLogin: body.first_login,
    address: body.address,
    complement: body.complement,
    city: body.city,
    postalCode: body.postal_code,
    region: body.region,
    role: body.role,
    clientId: body.client_id,
    billingEmails: body.billing_emails,
    status: body.status,
    isTrustworthy: body.is_trustworthy,
    isDeleted: body.is_deleted,
    mapGroupId: body.map_group_id,
    parentId: body.parent_id,
    accountType: body.account_type
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
