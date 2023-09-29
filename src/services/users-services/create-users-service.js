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
    timezone: payload.selectedTimezone,
    language: payload.selectedLanguage,
    email: payload.email,
    mobile: payload.mobile,
    is_account_owner: payload.owner,
    teams: [payload.selectedTeam],
    two_factor_enabled: payload.mfa
  }
}
