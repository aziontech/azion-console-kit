import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'

export const loadUserService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const responseData = httpResponse.body.data
  const parsedUser = {
    id: responseData.id,
    firstName: responseData.first_name,
    lastName: responseData.last_name,
    email: responseData.email,
    language: responseData.language,
    timezone: responseData.timezone,
    countryCallCode: responseData.country_call_code,
    mobile: responseData.mobile,
    userIsOwner: responseData.is_account_owner,
    teamsIds: responseData.teams.map(value => value.id),
    twoFactorEnabled: responseData.two_factor_enabled
  }

  return {
    body: parsedUser,
    statusCode: httpResponse.statusCode
  }
}
