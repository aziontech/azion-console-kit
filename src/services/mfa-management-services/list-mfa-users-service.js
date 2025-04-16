import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeMfaBaseUrl } from './make-mfa-management-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { extractApiError } from '@/helpers/extract-api-error'

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
  httpResponse = adapt(httpResponse)

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

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const parsedMfaUsers = httpResponse.body.results?.map((user) => {
    return {
      id: user.id,
      email: user.name,
      confirmed: CONFIRMED_AS_TAG[user.confirmed]
    }
  })
  const count = httpResponse.body?.count ?? 0
  return {
    count: count,
    body: parsedMfaUsers,
    statusCode: httpResponse.statusCode
  }
}
