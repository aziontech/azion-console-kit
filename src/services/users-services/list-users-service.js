import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'

export const listUsersService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */
  const isArray = Array.isArray(httpResponse.body.results)

  const parsedUsers = isArray
    ? httpResponse.body.results.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        teams: user.teams,
        mfa: user.two_factor_enabled ? 'Yes' : 'No',
        active: user.is_active ? 'Yes' : 'No',
        owner: user.is_account_owner ? 'Yes' : 'No'
      }))
    : []

  return {
    body: parsedUsers,
    statusCode: httpResponse.statusCode
  }
}
