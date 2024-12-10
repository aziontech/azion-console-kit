import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'
import { useAccountStore } from '@/stores/account'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listUsersService = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
} = {}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const ACTIVE_AS_TAG = {
  true: {
    content: 'Active',
    severity: 'success'
  },
  false: {
    content: 'Inactive',
    severity: 'danger'
  }
}

const OWNER_AS_TAG = {
  true: {
    content: 'Yes',
    severity: 'success'
  },
  false: {
    content: 'No',
    severity: 'info'
  }
}

const parseUser = (user) => {
  const formatTeams = (teams) => {
    return teams.length > 1
      ? teams.map((team) => team.name).join(', ')
      : teams.map((team) => team.name)
  }

  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    teams: formatTeams(user.teams),
    mfa: ACTIVE_AS_TAG[user.two_factor_enabled],
    status: ACTIVE_AS_TAG[user.is_active],
    owner: OWNER_AS_TAG[user.is_account_owner]
  }
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other endpoints.
   */
  const responseIsArray = Array.isArray(httpResponse.body.results)
  const { user_id: userLoggedId } = useAccountStore().accountData

  const removeUserIfItsMe = (user) => user.id !== userLoggedId

  const parsedUsers = responseIsArray
    ? httpResponse.body.results.map(parseUser).filter(removeUserIfItsMe)
    : []

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedUsers,
    statusCode: httpResponse.statusCode
  }
}
