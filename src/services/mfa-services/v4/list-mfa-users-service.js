import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeMfaBaseUrl } from './make-mfa-management-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { extractApiError } from '@/helpers/extract-api-error'
import { loadUserService } from './load-user-service'

export const listMfaUsersService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMfaBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })
  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const CONFIRMED_AS_TAG = {
  true: {
    content: 'Confirmed',
    severity: 'success'
  },
  false: {
    content: 'Not Confirmed',
    severity: 'danger'
  }
}

const loadUser = async (id) => {
  const response = await loadUserService({ id })
  return response?.email
}

const adapt = async (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  let parsedMfaUsers = []

  for (const user of httpResponse.body.results) {
    user.confirmed = CONFIRMED_AS_TAG[user.confirmed]

    if (!user.name) {
      user.name = await loadUser(user.user_id)
    }

    parsedMfaUsers.push({
      id: user.id,
      email: user.name,
      confirmed: user.confirmed
    })
  }

  const count = httpResponse.body?.count ?? 0
  return {
    count: count,
    body: parsedMfaUsers,
    statusCode: httpResponse.statusCode
  }
}
