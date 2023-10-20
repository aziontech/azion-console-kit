import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'

export const createUsersService = async (payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}`,
    method: 'POST',
    body: bodyRequest
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    language: payload.selectedLanguage,
    timezone: payload.selectedTimezone,
    country_call_code: payload.selectedCountry.value,
    mobile: payload.mobile?.toString(),
    is_account_owner: payload.userIsOwner,
    teams_ids: payload.selectedTeam,
    two_factor_enabled: payload.twoFactorEnabled
  }
}
