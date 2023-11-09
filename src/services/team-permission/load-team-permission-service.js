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
        id: httpResponse.body.id,
        name: httpResponse.body.name,
        permissions: httpResponse.body.permissions,
        isActive: httpResponse.body.is_active
      },
    statusCode: httpResponse.statusCode
  }
}
