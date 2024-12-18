import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTeamPermissionBaseUrl } from './make-team-permission-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listTeamPermissionService = async ({
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10,
  search = ''
} = {}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTeamPermissionBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}
const parseStatusData = (status) => {
  const parsedStatus = status
    ? {
        content: 'Active',
        severity: 'success'
      }
    : {
        content: 'Inactive',
        severity: 'danger'
      }

  return parsedStatus
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  // eslint-disable-next-line no-console
  const isArray = Array.isArray(httpResponse.body.results)

  const parsedTeamPermission = isArray
    ? httpResponse.body.results.map((team) => ({
        id: team.id,
        name: team.name,
        permissions: team.permissions.length ? team.permissions.map((item) => item.name) : [],
        status: parseStatusData(team.is_active)
      }))
    : []

  const count = httpResponse.body.count

  return {
    count,
    body: parsedTeamPermission,
    statusCode: httpResponse.statusCode
  }
}
