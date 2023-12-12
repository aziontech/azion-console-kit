import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'

export const loadUserService = async ({id}) => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}/${id}`,
    method: 'GET'
  })

  return parseHttpResponse(adapt(httpResponse))
}


const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other endpoints.
   */
  const parsedUsers = {
    countryCallCode: httpResponse.body.data.country_call_code,
    dateJoined: httpResponse.body.data.date_joined,
    email: httpResponse.body.data.email,
    firstName: httpResponse.body.data.first_name,
    id: httpResponse.body.data.id,
    isAccountOwner: httpResponse.body.data.is_account_owner,
    isActive: httpResponse.body.data.is_active,
    isStaff: httpResponse.body.data.is_staff,
    isTrial: httpResponse.body.data.is_trial,
    language: httpResponse.body.data.language,
    lastLogin: httpResponse.body.data.last_login,
    lastName: httpResponse.body.data.last_name,
    mobile: httpResponse.body.data.mobile,
    phone: httpResponse.body.data.phone,
    teams: httpResponse.body.data.teams,
    timezone: httpResponse.body.data.timezone,
    twoFactorEnabled: httpResponse.body.data.two_factor_enabled
  }
 

  return {
    body: parsedUsers,
    statusCode: httpResponse.statusCode
  }
}