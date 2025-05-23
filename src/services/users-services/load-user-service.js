import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUserBaseUrl } from './make-user-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadUserService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUserBaseUrl()}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }
  const responseData = httpResponse.body.data
  const parsedUser = {
    id: responseData.id,
    firstName: responseData.first_name,
    lastName: responseData.last_name,
    email: responseData.email,
    language: responseData.language,
    timezone: responseData.timezone,
    countryCallCode: responseData.country_call_code,
    mobile: responseData.mobile || '',
    isAccountOwner: responseData.is_account_owner,
    teamsIds: responseData.teams.map((value) => value.id),
    twoFactorEnabled: responseData.two_factor_enabled,
    dateJoined: responseData.date_joined,
    isActive: responseData.is_active,
    isStaff: responseData.is_staff,
    isTrial: responseData.is_trial,
    lastLogin: responseData.last_login,
    phone: responseData.phone,
    teams: responseData.teams
  }

  return {
    body: parsedUser,
    statusCode: httpResponse.statusCode
  }
}
