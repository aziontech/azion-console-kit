import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'

export const listUsersService = async ({
  orderBy = 'id',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}
const activeAsTag = (status) => {
  const severity = status ? 'success' : 'danger'
  return {
    content: status ? 'Yes' : 'No',
    severity
  }
}
const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other endpoints.
   */
  const isArray = Array.isArray(httpResponse.body.results)

  const parsedUsers = isArray
    ? httpResponse.body.results.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        teams:
          user.teams.length > 1
            ? user.teams.map((t) => t.name).join(', ')
            : user.teams.map((t) => t.name),
        mfa: user.two_factor_enabled ? 'Yes' : 'No',
        active: activeAsTag(user.is_active),
        owner: user.is_account_owner ? 'Yes' : 'No'
      }))
    : []

  return {
    body: parsedUsers,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('order_by', orderBy)
  searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}
