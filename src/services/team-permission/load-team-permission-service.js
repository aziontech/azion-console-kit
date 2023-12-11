import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTeamPermissionBaseUrl } from './make-team-permission-base-url'

export const loadTeamPermissionService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTeamPermissionBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  return {
    body: {
      id: httpResponse.body.data.id,
      name: httpResponse.body.data.name,
      permissions: httpResponse.body.data.permissions,
      isActive: httpResponse.body.data.is_active
    },
    statusCode: httpResponse.statusCode
  }
}
