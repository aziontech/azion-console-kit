import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const listClientIdsReleasedForConsoleService = async () => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `/github`,
    method: 'GET'
  })
  return adapt(httpResponse)
}

const adapt = (httpResponse) => {
  const responseIsArray = Array.isArray(httpResponse?.body?.client_ids)

  return responseIsArray ? httpResponse?.body?.client_ids : []
}
